"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { REPUTATION_POINTS } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { ImprovementDiscussionMessage, ImprovementRequest } from "@/models/ImprovementRequest";
import { Prompt } from "@/models/Prompt";
import { PromptVersion } from "@/models/PromptVersion";
import { Skill } from "@/models/Skill";
import { SkillVersion } from "@/models/SkillVersion";
import { User } from "@/models/User";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { actionFailure, authIdentity, canManage, changedSnapshotPaths, contentHash, formDataObject, PublicActionError, skillDependencies, toObjectId, validationState, workflowSteps } from "@/features/content/mutation-helpers";
import { awardReputation, createNotification } from "@/features/content/mutation-services";
import { createPromptSchema, createSkillSchema, improvementDecisionSchema } from "@/features/content/validation";
import { nextVersionLabel } from "@/features/improvements/versioning";

const promptProposalSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(1_000),
  content: z.string().min(10).max(100_000),
  tags: z.array(z.string().max(32)).max(12),
  category: z.enum(["development", "writing", "design", "business", "education", "research", "productivity", "other"]),
  license: z.enum(["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"]).default("unspecified"),
});

const skillProposalSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(10).max(1_000),
  instructions: z.string().min(20).max(100_000),
  requiredKnowledge: z.array(z.string().max(120)).max(30),
  workflow: z.array(z.object({ order: z.number().int().positive(), title: z.string().max(120), instruction: z.string().max(4_000) })).max(30),
  tools: z.array(z.string().max(120)).max(30),
  dependencies: z.array(z.object({ skillId: z.unknown().optional().nullable(), name: z.string().max(120), versionRange: z.string().max(32), optional: z.boolean() })).max(20),
  tags: z.array(z.string().max(32)).max(12),
  license: z.enum(["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"]).default("unspecified"),
});

function proposalFromValues(targetType: "Prompt" | "Skill", values: Record<string, FormDataEntryValue>) {
  if (targetType === "Prompt") {
    const parsed = createPromptSchema.safeParse(values);
    if (!parsed.success) return { success: false as const, error: parsed.error };
    return { success: true as const, snapshot: {
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      tags: parsed.data.tags,
      category: parsed.data.category,
      license: parsed.data.license,
    } };
  }
  const parsed = createSkillSchema.safeParse(values);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  return { success: true as const, snapshot: {
    name: parsed.data.name,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    requiredKnowledge: parsed.data.requiredKnowledge,
    workflow: workflowSteps(parsed.data.workflow),
    tools: parsed.data.tools,
    dependencies: skillDependencies(parsed.data.dependencies),
    tags: parsed.data.tags,
    license: parsed.data.license,
  } };
}

function statusMessage(decision: "reject" | "request-changes" | "close", reason: string) {
  if (decision === "request-changes") return `مالک درخواست تغییر کرد${reason ? `: ${reason}` : "."}`;
  if (decision === "reject") return `پیشنهاد رد شد${reason ? `: ${reason}` : "."}`;
  return `پیشنهاد بسته شد${reason ? `: ${reason}` : "."}`;
}

export async function decideImprovementAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = improvementDecisionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const requestId = toObjectId(parsed.data.requestId, "شناسه پیشنهاد");
  const { decision, reason, versionBump, customVersionLabel } = parsed.data;
  let baseConflictDetected = false;

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const request = await ImprovementRequest.findById(requestId).session(session);
      if (!request) throw new PublicActionError("پیشنهاد بهبود پیدا نشد.");
      const owner = canManage(request.ownerId, user);
      const proposer = String(request.proposerId) === String(user.id);

      if (decision === "close") {
        if (!owner && !proposer) throw new PublicActionError("اجازه بستن این پیشنهاد را ندارید.");
        if (!["open", "changes-requested", "draft"].includes(request.status)) throw new PublicActionError("این پیشنهاد قبلاً نهایی شده است.");
        request.status = "closed";
        request.closedAt = new Date();
        request.decisionReason = reason;
        request.lastActivityAt = new Date();
        await request.save({ session });
        await ImprovementDiscussionMessage.create([{ requestId, senderId: user.id, kind: "decision", content: statusMessage("close", reason), readBy: [user.id] }], { session });
        return;
      }

      if (!owner) throw new PublicActionError("فقط مالک محتوا می‌تواند درباره پیشنهاد تصمیم بگیرد.");
      if (!["open", "changes-requested"].includes(request.status)) throw new PublicActionError("این پیشنهاد دیگر در انتظار بررسی نیست.");

      if (decision === "request-changes" || decision === "reject") {
        if (!reason.trim()) throw new PublicActionError(decision === "reject" ? "دلیل رد را بنویسید." : "تغییر مورد نیاز را توضیح دهید.");
        request.status = decision === "reject" ? "rejected" : "changes-requested";
        request.decisionReason = reason;
        request.decidedAt = decision === "reject" ? new Date() : null;
        request.lastActivityAt = new Date();
        await request.save({ session });
        await ImprovementDiscussionMessage.create([{ requestId, senderId: user.id, kind: decision === "reject" ? "decision" : "changes-requested", content: statusMessage(decision, reason), readBy: [user.id] }], { session });
        await createNotification({
          recipientId: request.proposerId,
          actorId: user.id,
          type: decision === "reject" ? "improvement-rejected" : "improvement-changes-requested",
          title: decision === "reject" ? "پیشنهاد بهبود رد شد" : "تغییرات بیشتری درخواست شد",
          body: reason,
          entityModel: "ImprovementRequest",
          entityId: requestId,
          href: `/improvements/${requestId}`,
          dedupeKey: `${decision}:${requestId}:${request.updatedAt.getTime()}`,
          session,
        });
        return;
      }

      const nextVersionId = new Types.ObjectId();
      let targetSlug = "";
      if (request.targetType === "Prompt") {
        const target = await Prompt.findById(request.targetId).session(session);
        if (!target) throw new PublicActionError("پرامپت اصلی پیدا نشد.");
        if (String(target.currentVersionId) !== String(request.baseVersionId)) {
          request.hasBaseConflict = true;
          request.lastActivityAt = new Date();
          await request.save({ session });
          baseConflictDetected = true;
          return;
        }
        const snapshot = promptProposalSchema.parse({
          ...request.proposedSnapshot,
          category: request.proposedSnapshot?.category ?? target.category,
          license: request.proposedSnapshot?.license ?? target.license,
        });
        const nextVersion = target.currentVersion + 1;
        const versionLabel = nextVersionLabel(target.currentVersionLabel, versionBump, customVersionLabel);
        if (!versionLabel) throw new PublicActionError("برچسب نسخه سفارشی معتبر نیست.");
        const updated = await Prompt.updateOne(
          { _id: target._id, currentVersionId: request.baseVersionId },
          { $set: { ...snapshot, currentVersion: nextVersion, currentVersionLabel: versionLabel, currentVersionId: nextVersionId, updatedAt: new Date() } },
          { session },
        );
        if (updated.modifiedCount !== 1) {
          request.hasBaseConflict = true;
          request.lastActivityAt = new Date();
          await request.save({ session });
          baseConflictDetected = true;
          return;
        }
        await PromptVersion.create([{
          _id: nextVersionId,
          promptId: target._id,
          versionNumber: nextVersion,
          versionLabel,
          ...snapshot,
          changeSummary: request.summary,
          authorId: request.proposerId,
          parentVersionId: target.currentVersionId,
          acceptedRequestId: requestId,
          source: "accepted-improvement",
          contentHash: contentHash(snapshot),
          isOfficial: true,
        }], { session });
        targetSlug = target.slug;
      } else {
        const target = await Skill.findById(request.targetId).session(session);
        if (!target) throw new PublicActionError("مهارت اصلی پیدا نشد.");
        if (String(target.currentVersionId) !== String(request.baseVersionId)) {
          request.hasBaseConflict = true;
          request.lastActivityAt = new Date();
          await request.save({ session });
          baseConflictDetected = true;
          return;
        }
        const snapshot = skillProposalSchema.parse({
          ...request.proposedSnapshot,
          license: request.proposedSnapshot?.license ?? target.license,
        });
        const nextVersion = target.currentVersion + 1;
        const versionLabel = nextVersionLabel(target.currentVersionLabel, versionBump, customVersionLabel);
        if (!versionLabel) throw new PublicActionError("برچسب نسخه سفارشی معتبر نیست.");
        const updated = await Skill.updateOne(
          { _id: target._id, currentVersionId: request.baseVersionId },
          { $set: { ...snapshot, currentVersion: nextVersion, currentVersionLabel: versionLabel, currentVersionId: nextVersionId, updatedAt: new Date() } },
          { session },
        );
        if (updated.modifiedCount !== 1) {
          request.hasBaseConflict = true;
          request.lastActivityAt = new Date();
          await request.save({ session });
          baseConflictDetected = true;
          return;
        }
        await SkillVersion.create([{
          _id: nextVersionId,
          skillId: target._id,
          versionNumber: nextVersion,
          versionLabel,
          ...snapshot,
          changeSummary: request.summary,
          authorId: request.proposerId,
          parentVersionId: target.currentVersionId,
          acceptedRequestId: requestId,
          source: "accepted-improvement",
          contentHash: contentHash(snapshot),
          isOfficial: true,
        }], { session });
        targetSlug = target.slug;
      }

      request.status = "accepted";
      request.acceptedVersionModel = request.targetType === "Prompt" ? "PromptVersion" : "SkillVersion";
      request.acceptedVersionId = nextVersionId;
      request.versionBump = versionBump;
      request.customVersionLabel = customVersionLabel;
      request.decisionReason = reason;
      request.decidedAt = new Date();
      request.lastActivityAt = new Date();
      await request.save({ session });
      await ImprovementDiscussionMessage.create([{ requestId, senderId: user.id, kind: "decision", content: `پیشنهاد پذیرفته شد و نسخه رسمی تازه ساخته شد${reason ? `: ${reason}` : "."}`, readBy: [user.id] }], { session });
      await User.updateOne({ _id: request.proposerId }, { $inc: { "stats.acceptedImprovements": 1 } }, { session });
      await awardReputation({
        userId: request.proposerId,
        actorId: user.id,
        reason: "improvement-accepted",
        points: REPUTATION_POINTS.acceptedImprovement,
        targetModel: "ImprovementRequest",
        targetId: requestId,
        description: "پذیرش یک پیشنهاد بهبود",
        dedupeKey: `improvement-accepted:${requestId}`,
        session,
      });
      await createNotification({
        recipientId: request.proposerId,
        actorId: user.id,
        type: "improvement-accepted",
        title: "پیشنهاد شما پذیرفته شد",
        body: "نسخه رسمی تازه با نام شما ساخته شد.",
        entityModel: "ImprovementRequest",
        entityId: requestId,
        href: `/${request.targetType === "Prompt" ? "prompts" : "skills"}/${targetSlug}`,
        dedupeKey: `improvement-accepted:${requestId}`,
        session,
      });
    });
  } catch (error) {
    return actionFailure(error);
  }

  if (baseConflictDetected) {
    return actionFailure(
      new PublicActionError(
        "نسخه اصلی پس از ثبت پیشنهاد تغییر کرده است. ابتدا تغییرات را با نسخه جدید هماهنگ کنید.",
      ),
    );
  }

  revalidatePath(`/improvements/${requestId}`);
  revalidatePath("/improvements");
  revalidatePath("/explore");
  return { status: "success", message: decision === "accept" ? "پیشنهاد پذیرفته شد و نسخه رسمی تازه ساخته شد." : "وضعیت پیشنهاد به‌روز شد.", data: { status: decision } };
}

export async function updateImprovementProposalAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const values = formDataObject(formData);
  const requestIdValue = typeof values.requestId === "string" ? values.requestId : "";
  if (!Types.ObjectId.isValid(requestIdValue)) return { status: "error", message: "شناسه پیشنهاد معتبر نیست." };
  const requestId = new Types.ObjectId(requestIdValue);
  const summary = typeof values.summary === "string" ? values.summary.trim() : "";
  if (summary.length < 10 || summary.length > 4_000) return { status: "error", message: "خلاصه تغییرات باید بین ۱۰ تا ۴۰۰۰ نویسه باشد." };

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const request = await ImprovementRequest.findById(requestId).session(session);
      if (!request) throw new PublicActionError("پیشنهاد بهبود پیدا نشد.");
      if (!canManage(request.ownerId, user)) throw new PublicActionError("فقط مالک محتوا می‌تواند نسخه پیشنهادی را اصلاح کند.");
      if (!["open", "changes-requested"].includes(request.status)) throw new PublicActionError("این پیشنهاد دیگر قابل ویرایش نیست.");

      const proposal = proposalFromValues(request.targetType, values);
      if (!proposal.success) throw new PublicActionError(proposal.error.issues[0]?.message ?? "نسخه پیشنهادی معتبر نیست.");
      const base = request.targetType === "Prompt"
        ? await PromptVersion.findById(request.baseVersionId).session(session)
        : await SkillVersion.findById(request.baseVersionId).session(session);
      if (!base) throw new PublicActionError("نسخه پایه پیدا نشد.");
      const baseObject = base.toObject() as Record<string, unknown>;
      const baseSnapshot = Object.fromEntries(Object.keys(proposal.snapshot).map((key) => [key, baseObject[key]]));
      const changedPaths = changedSnapshotPaths(baseSnapshot, proposal.snapshot);
      if (!changedPaths.length) throw new PublicActionError("نسخه پیشنهادی با نسخه پایه تفاوتی ندارد.");

      request.proposedSnapshot = proposal.snapshot;
      request.changedPaths = changedPaths;
      request.summary = summary;
      request.ownerEditedAt = new Date();
      request.lastActivityAt = new Date();
      await request.save({ session });
      await ImprovementDiscussionMessage.create([{ requestId, senderId: user.id, kind: "system", content: "مالک نسخه پیشنهادی را ویرایش کرد.", readBy: [user.id] }], { session });
      await createNotification({ recipientId: request.proposerId, actorId: user.id, type: "improvement-changes-requested", title: "مالک پیشنهاد را ویرایش کرد", body: summary, entityModel: "ImprovementRequest", entityId: requestId, href: `/improvements/${requestId}`, dedupeKey: `improvement-owner-edit:${requestId}:${Date.now()}`, session });
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidatePath(`/improvements/${requestId}`);
  return { status: "success", message: "نسخه پیشنهادی به‌روزرسانی شد." };
}
