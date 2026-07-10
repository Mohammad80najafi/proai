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
import { actionFailure, authIdentity, canManage, contentHash, formDataObject, PublicActionError, toObjectId, validationState } from "@/features/content/mutation-helpers";
import { awardReputation, createNotification } from "@/features/content/mutation-services";
import { improvementDecisionSchema } from "@/features/content/validation";

const promptProposalSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(1_000),
  content: z.string().min(10).max(100_000),
  tags: z.array(z.string().max(32)).max(12),
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
});

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
  const { decision, reason } = parsed.data;
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
        const snapshot = promptProposalSchema.parse(request.proposedSnapshot);
        const nextVersion = target.currentVersion + 1;
        const updated = await Prompt.updateOne(
          { _id: target._id, currentVersionId: request.baseVersionId },
          { $set: { ...snapshot, currentVersion: nextVersion, currentVersionId: nextVersionId, updatedAt: new Date() } },
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
        const snapshot = skillProposalSchema.parse(request.proposedSnapshot);
        const nextVersion = target.currentVersion + 1;
        const updated = await Skill.updateOne(
          { _id: target._id, currentVersionId: request.baseVersionId },
          { $set: { ...snapshot, currentVersion: nextVersion, currentVersionId: nextVersionId, updatedAt: new Date() } },
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
