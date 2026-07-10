"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types, type ClientSession } from "mongoose";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { REPUTATION_POINTS } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { Comment } from "@/models/Comment";
import {
  ImprovementDiscussionMessage,
  ImprovementRequest,
} from "@/models/ImprovementRequest";
import { Like, Rating, Save } from "@/models/Interaction";
import { Prompt } from "@/models/Prompt";
import { PromptVersion } from "@/models/PromptVersion";
import { Skill } from "@/models/Skill";
import { SkillVersion } from "@/models/SkillVersion";
import { User } from "@/models/User";

import {
  commentSchema,
  createPromptSchema,
  createSkillSchema,
  improvementMessageSchema,
  improvementRequestSchema,
  interactionSchema,
  ratingSchema,
} from "./validation";
import {
  actionFailure,
  authIdentity,
  canManage,
  changedSnapshotPaths,
  contentHash,
  formDataObject,
  makeContentSlug,
  PublicActionError,
  skillDependencies,
  toObjectId,
  validationState,
  workflowSteps,
  type ContentActionState,
} from "./mutation-helpers";
import { awardReputation, createNotification } from "./mutation-services";

const objectIdSchema = z.string().refine(Types.ObjectId.isValid, "شناسه معتبر نیست.");
const changeSummarySchema = z
  .string()
  .trim()
  .min(3, "خلاصه تغییرات باید حداقل ۳ نویسه باشد.")
  .max(2_000);
const promptVersionSchema = createPromptSchema.extend({
  promptId: objectIdSchema,
  changeSummary: changeSummarySchema,
});
const skillVersionSchema = createSkillSchema.extend({
  skillId: objectIdSchema,
  changeSummary: changeSummarySchema,
});
const forkSchema = z.object({ targetId: objectIdSchema });

type PromptSnapshot = {
  title: string;
  description: string;
  content: string;
  category: z.infer<typeof createPromptSchema>["category"];
  tags: string[];
  visibility: "draft" | "public" | "unlisted";
  license: z.infer<typeof createPromptSchema>["license"];
};

type WorkflowStep = { order: number; title: string; instruction: string };
type SkillDependency = {
  skillId?: Types.ObjectId | null;
  name: string;
  versionRange: string;
  optional: boolean;
};
type SkillSnapshot = {
  name: string;
  description: string;
  instructions: string;
  requiredKnowledge: string[];
  workflow: WorkflowStep[];
  tools: string[];
  dependencies: SkillDependency[];
  tags: string[];
  visibility: "draft" | "public" | "unlisted";
  license: z.infer<typeof createSkillSchema>["license"];
};

function promptSnapshot(input: z.infer<typeof createPromptSchema>): PromptSnapshot {
  return {
    title: input.title,
    description: input.description,
    content: input.content,
    category: input.category,
    tags: input.tags,
    visibility: input.visibility,
    license: input.license,
  };
}

function skillSnapshot(input: z.infer<typeof createSkillSchema>): SkillSnapshot {
  return {
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    requiredKnowledge: input.requiredKnowledge,
    workflow: workflowSteps(input.workflow),
    tools: input.tools,
    dependencies: skillDependencies(input.dependencies),
    tags: input.tags,
    visibility: input.visibility,
    license: input.license,
  };
}

function versionPromptSnapshot(snapshot: PromptSnapshot) {
  return {
    title: snapshot.title,
    description: snapshot.description,
    content: snapshot.content,
    tags: snapshot.tags,
  };
}

function versionSkillSnapshot(snapshot: SkillSnapshot) {
  return {
    name: snapshot.name,
    description: snapshot.description,
    instructions: snapshot.instructions,
    requiredKnowledge: snapshot.requiredKnowledge,
    workflow: snapshot.workflow,
    tools: snapshot.tools,
    dependencies: snapshot.dependencies,
    tags: snapshot.tags,
  };
}

function revalidateContent(targetType: "Prompt" | "Skill", slug?: string) {
  const segment = targetType === "Prompt" ? "prompts" : "skills";
  revalidatePath("/explore");
  revalidatePath(`/${segment}`);
  if (slug) revalidatePath(`/${segment}/${slug}`);
}

function firstPublishedAt(
  current: Date | null | undefined,
  visibility: "draft" | "public" | "unlisted",
) {
  return current ?? (visibility === "draft" ? null : new Date());
}

export async function createPromptAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = createPromptSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);

  const snapshot = promptSnapshot(parsed.data);
  const promptId = new Types.ObjectId();
  const versionId = new Types.ObjectId();
  const slug = makeContentSlug(snapshot.title, "prompt");

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      await Prompt.create(
        [
          {
            _id: promptId,
            ...snapshot,
            slug,
            creatorId: user.id,
            currentVersionId: versionId,
            currentVersion: 1,
            publishedAt: firstPublishedAt(null, snapshot.visibility),
          },
        ],
        { session },
      );
      await PromptVersion.create(
        [
          {
            _id: versionId,
            promptId,
            versionNumber: 1,
            ...versionPromptSnapshot(snapshot),
            changeSummary: "نسخه اولیه",
            authorId: user.id,
            parentVersionId: null,
            source: "initial",
            contentHash: contentHash(versionPromptSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );
      await User.updateOne({ _id: user.id }, { $inc: { "stats.prompts": 1 } }, { session });

      if (snapshot.visibility !== "draft") {
        await awardReputation({
          userId: user.id,
          actorId: user.id,
          reason: "prompt-published",
          points: REPUTATION_POINTS.createPrompt,
          targetModel: "Prompt",
          targetId: promptId,
          description: "انتشار یک پرامپت تازه",
          dedupeKey: `prompt-published:${promptId}`,
          session,
        });
      }
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Prompt", slug);
  revalidatePath(`/users/${user.username ?? ""}`);
  redirect(`/prompts/${slug}`);
}

export async function createSkillAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = createSkillSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);

  const snapshot = skillSnapshot(parsed.data);
  const skillId = new Types.ObjectId();
  const versionId = new Types.ObjectId();
  const slug = makeContentSlug(snapshot.name, "skill");

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      await Skill.create(
        [
          {
            _id: skillId,
            ...snapshot,
            slug,
            creatorId: user.id,
            currentVersionId: versionId,
            currentVersion: 1,
            publishedAt: firstPublishedAt(null, snapshot.visibility),
          },
        ],
        { session },
      );
      await SkillVersion.create(
        [
          {
            _id: versionId,
            skillId,
            versionNumber: 1,
            ...versionSkillSnapshot(snapshot),
            changeSummary: "نسخه اولیه",
            authorId: user.id,
            parentVersionId: null,
            source: "initial",
            contentHash: contentHash(versionSkillSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );
      await User.updateOne({ _id: user.id }, { $inc: { "stats.skills": 1 } }, { session });

      if (snapshot.visibility !== "draft") {
        await awardReputation({
          userId: user.id,
          actorId: user.id,
          reason: "skill-published",
          points: REPUTATION_POINTS.createSkill,
          targetModel: "Skill",
          targetId: skillId,
          description: "انتشار یک مهارت تازه",
          dedupeKey: `skill-published:${skillId}`,
          session,
        });
      }
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Skill", slug);
  revalidatePath(`/users/${user.username ?? ""}`);
  redirect(`/skills/${slug}`);
}

export async function createPromptVersionAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = promptVersionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const promptId = toObjectId(parsed.data.promptId, "شناسه پرامپت");
  const snapshot = promptSnapshot(parsed.data);
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const prompt = await Prompt.findById(promptId).session(session);
      if (!prompt) throw new PublicActionError("پرامپت پیدا نشد.");
      if (!canManage(prompt.creatorId, user)) {
        throw new PublicActionError("فقط مالک پرامپت می‌تواند نسخه رسمی بسازد.");
      }

      slug = prompt.slug;
      const previousVersion = prompt.currentVersion;
      const nextVersion = previousVersion + 1;
      const versionId = new Types.ObjectId();
      const rootUpdate = await Prompt.updateOne(
        { _id: promptId, currentVersion: previousVersion },
        {
          $set: {
            ...snapshot,
            currentVersion: nextVersion,
            currentVersionId: versionId,
            publishedAt: firstPublishedAt(prompt.publishedAt, snapshot.visibility),
          },
        },
        { session },
      );
      if (rootUpdate.modifiedCount !== 1) {
        throw new PublicActionError("نسخه تازه‌تری ثبت شده است. صفحه را به‌روز کنید.");
      }

      await PromptVersion.create(
        [
          {
            _id: versionId,
            promptId,
            versionNumber: nextVersion,
            ...versionPromptSnapshot(snapshot),
            changeSummary: parsed.data.changeSummary,
            authorId: user.id,
            parentVersionId: prompt.currentVersionId,
            source: "owner",
            contentHash: contentHash(versionPromptSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );

      if (!prompt.publishedAt && snapshot.visibility !== "draft") {
        await awardReputation({
          userId: prompt.creatorId,
          actorId: user.id,
          reason: "prompt-published",
          points: REPUTATION_POINTS.createPrompt,
          targetModel: "Prompt",
          targetId: promptId,
          description: "انتشار نخست یک پرامپت",
          dedupeKey: `prompt-published:${promptId}`,
          session,
        });
      }
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Prompt", slug);
  return { status: "success", message: "نسخه رسمی جدید ساخته شد." };
}

export async function createSkillVersionAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = skillVersionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const skillId = toObjectId(parsed.data.skillId, "شناسه مهارت");
  const snapshot = skillSnapshot(parsed.data);
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const skill = await Skill.findById(skillId).session(session);
      if (!skill) throw new PublicActionError("مهارت پیدا نشد.");
      if (!canManage(skill.creatorId, user)) {
        throw new PublicActionError("فقط مالک مهارت می‌تواند نسخه رسمی بسازد.");
      }

      slug = skill.slug;
      const previousVersion = skill.currentVersion;
      const nextVersion = previousVersion + 1;
      const versionId = new Types.ObjectId();
      const rootUpdate = await Skill.updateOne(
        { _id: skillId, currentVersion: previousVersion },
        {
          $set: {
            ...snapshot,
            currentVersion: nextVersion,
            currentVersionId: versionId,
            publishedAt: firstPublishedAt(skill.publishedAt, snapshot.visibility),
          },
        },
        { session },
      );
      if (rootUpdate.modifiedCount !== 1) {
        throw new PublicActionError("نسخه تازه‌تری ثبت شده است. صفحه را به‌روز کنید.");
      }

      await SkillVersion.create(
        [
          {
            _id: versionId,
            skillId,
            versionNumber: nextVersion,
            ...versionSkillSnapshot(snapshot),
            changeSummary: parsed.data.changeSummary,
            authorId: user.id,
            parentVersionId: skill.currentVersionId,
            source: "owner",
            contentHash: contentHash(versionSkillSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );

      if (!skill.publishedAt && snapshot.visibility !== "draft") {
        await awardReputation({
          userId: skill.creatorId,
          actorId: user.id,
          reason: "skill-published",
          points: REPUTATION_POINTS.createSkill,
          targetModel: "Skill",
          targetId: skillId,
          description: "انتشار نخست یک مهارت",
          dedupeKey: `skill-published:${skillId}`,
          session,
        });
      }
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Skill", slug);
  return { status: "success", message: "نسخه رسمی جدید ساخته شد." };
}

async function visibleTarget(
  targetType: "Prompt" | "Skill",
  targetId: Types.ObjectId,
  session: ClientSession,
) {
  const filter = {
    _id: targetId,
    visibility: { $in: ["public", "unlisted"] as const },
    moderationStatus: "visible" as const,
  };
  return targetType === "Prompt"
    ? Prompt.findOne(filter).session(session)
    : Skill.findOne(filter).session(session);
}

async function updateTargetStats(
  targetType: "Prompt" | "Skill",
  targetId: Types.ObjectId,
  stats: Record<string, number>,
  session: ClientSession,
) {
  return targetType === "Prompt"
    ? Prompt.updateOne({ _id: targetId }, { $set: stats }, { session })
    : Skill.updateOne({ _id: targetId }, { $set: stats }, { session });
}

export async function toggleLikeAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = interactionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const targetId = toObjectId(parsed.data.targetId, "شناسه محتوا");
  let active = false;
  let count = 0;
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const target = await visibleTarget(parsed.data.targetType, targetId, session);
      if (!target) throw new PublicActionError("محتوا پیدا نشد یا در دسترس نیست.");
      slug = target.slug;

      const existing = await Like.findOne({
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId,
      }).session(session);
      const currentCount = target.stats?.likes ?? 0;

      if (existing) {
        await existing.deleteOne({ session });
        active = false;
        count = Math.max(0, currentCount - 1);
      } else {
        await Like.create(
          [{ userId: user.id, targetType: parsed.data.targetType, targetId }],
          { session },
        );
        active = true;
        count = currentCount + 1;
        await createNotification({
          recipientId: target.creatorId,
          actorId: user.id,
          type: "like",
          title: "محتوای شما پسندیده شد",
          body: "title" in target
            ? `پرامپت «${target.title}» یک پسند تازه گرفت.`
            : `مهارت «${target.name}» یک پسند تازه گرفت.`,
          entityModel: parsed.data.targetType,
          entityId: targetId,
          href: `/${parsed.data.targetType === "Prompt" ? "prompts" : "skills"}/${target.slug}`,
          dedupeKey: `like:${parsed.data.targetType}:${targetId}:${user.id}`,
          session,
        });
      }

      await updateTargetStats(
        parsed.data.targetType,
        targetId,
        { "stats.likes": count },
        session,
      );
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent(parsed.data.targetType, slug);
  return {
    status: "success",
    message: active ? "به پسندیده‌ها اضافه شد." : "از پسندیده‌ها برداشته شد.",
    data: { active, count },
  };
}

export async function toggleSaveAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = interactionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const targetId = toObjectId(parsed.data.targetId, "شناسه محتوا");
  let active = false;
  let count = 0;
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const target = await visibleTarget(parsed.data.targetType, targetId, session);
      if (!target) throw new PublicActionError("محتوا پیدا نشد یا در دسترس نیست.");
      slug = target.slug;

      const existing = await Save.findOne({
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId,
      }).session(session);
      const currentCount = target.stats?.saves ?? 0;
      if (existing) {
        await existing.deleteOne({ session });
        active = false;
        count = Math.max(0, currentCount - 1);
      } else {
        await Save.create(
          [
            {
              userId: user.id,
              targetType: parsed.data.targetType,
              targetId,
              folder: "default",
            },
          ],
          { session },
        );
        active = true;
        count = currentCount + 1;
      }

      await updateTargetStats(
        parsed.data.targetType,
        targetId,
        { "stats.saves": count },
        session,
      );
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent(parsed.data.targetType, slug);
  revalidatePath("/saved");
  return {
    status: "success",
    message: active ? "محتوا ذخیره شد." : "از ذخیره‌ها برداشته شد.",
    data: { active, count },
  };
}

export async function rateContentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = ratingSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const targetId = toObjectId(parsed.data.targetId, "شناسه محتوا");
  let average = 0;
  let ratingCount = 0;
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const target = await visibleTarget(parsed.data.targetType, targetId, session);
      if (!target) throw new PublicActionError("محتوا پیدا نشد یا در دسترس نیست.");
      if (String(target.creatorId) === String(user.id)) {
        throw new PublicActionError("نمی‌توانید به محتوای خودتان امتیاز دهید.");
      }
      slug = target.slug;

      const existing = await Rating.findOne({
        userId: user.id,
        targetType: parsed.data.targetType,
        targetId,
      }).session(session);
      const oldAverage = target.stats?.ratingAverage ?? 0;
      const oldCount = target.stats?.ratingCount ?? 0;

      if (existing) {
        ratingCount = Math.max(1, oldCount);
        average =
          (oldAverage * ratingCount - existing.value + parsed.data.value) / ratingCount;
        existing.value = parsed.data.value;
        await existing.save({ session });
      } else {
        ratingCount = oldCount + 1;
        average = (oldAverage * oldCount + parsed.data.value) / ratingCount;
        await Rating.create(
          [
            {
              userId: user.id,
              targetType: parsed.data.targetType,
              targetId,
              value: parsed.data.value,
            },
          ],
          { session },
        );
      }

      average = Math.round(average * 100) / 100;
      await updateTargetStats(
        parsed.data.targetType,
        targetId,
        {
          "stats.ratingAverage": average,
          "stats.ratingCount": ratingCount,
        },
        session,
      );
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent(parsed.data.targetType, slug);
  return {
    status: "success",
    message: "امتیاز شما ثبت شد.",
    data: { rating: average, ratingCount },
  };
}

function mentionedUsernames(content: string) {
  const matches = content.matchAll(/(?:^|\s)@([a-z0-9][a-z0-9_-]{1,29})/gi);
  return [...new Set(Array.from(matches, (match) => match[1].toLowerCase()))].slice(0, 20);
}

export async function addCommentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = commentSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const targetId = toObjectId(parsed.data.targetId, "شناسه محتوا");
  const commentId = new Types.ObjectId();
  let slug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const target = await visibleTarget(parsed.data.targetType, targetId, session);
      if (!target) throw new PublicActionError("محتوا پیدا نشد یا در دسترس نیست.");
      slug = target.slug;

      const usernames = mentionedUsernames(parsed.data.content);
      const mentionedUsers = usernames.length
        ? await User.find({ username: { $in: usernames }, accountStatus: "active" })
            .select("_id")
            .session(session)
        : [];
      const mentions = mentionedUsers
        .map((mentioned) => mentioned._id)
        .filter((mentionedId) => String(mentionedId) !== String(user.id));

      await Comment.create(
        [
          {
            _id: commentId,
            userId: user.id,
            targetType: parsed.data.targetType,
            targetId,
            content: parsed.data.content,
            mentions,
          },
        ],
        { session },
      );
      await updateTargetStats(
        parsed.data.targetType,
        targetId,
        { "stats.comments": (target.stats?.comments ?? 0) + 1 },
        session,
      );

      const segment = parsed.data.targetType === "Prompt" ? "prompts" : "skills";
      const href = `/${segment}/${target.slug}#comment-${commentId}`;
      await createNotification({
        recipientId: target.creatorId,
        actorId: user.id,
        type: "comment",
        title: "دیدگاه تازه‌ای دریافت کردید",
        body: parsed.data.content.slice(0, 300),
        entityModel: "Comment",
        entityId: commentId,
        href,
        dedupeKey: `comment-owner:${commentId}`,
        session,
      });
      await Promise.all(
        mentions
          .filter((mentionedId) => String(mentionedId) !== String(target.creatorId))
          .map((mentionedId) =>
            createNotification({
              recipientId: mentionedId,
              actorId: user.id,
              type: "mention",
              title: "در یک دیدگاه به شما اشاره شد",
              body: parsed.data.content.slice(0, 300),
              entityModel: "Comment",
              entityId: commentId,
              href,
              dedupeKey: `comment-mention:${commentId}:${mentionedId}`,
              session,
            }),
          ),
      );
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent(parsed.data.targetType, slug);
  return {
    status: "success",
    message: "دیدگاه شما منتشر شد.",
    data: { id: String(commentId) },
  };
}

export async function forkPromptAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const values = formDataObject(formData);
  const parsed = forkSchema.safeParse({ targetId: values.targetId ?? values.promptId });
  if (!parsed.success) return validationState(parsed.error);
  const sourceId = toObjectId(parsed.data.targetId, "شناسه پرامپت");
  const forkId = new Types.ObjectId();
  const versionId = new Types.ObjectId();
  let sourceSlug = "";
  let forkSlug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const source = await Prompt.findOne({
        _id: sourceId,
        visibility: "public",
        moderationStatus: "visible",
      }).session(session);
      if (!source || !source.currentVersionId) {
        throw new PublicActionError("این پرامپت عمومی نیست یا نسخه رسمی ندارد.");
      }

      sourceSlug = source.slug;
      forkSlug = makeContentSlug(source.title, "prompt");
      const snapshot: PromptSnapshot = {
        title: source.title,
        description: source.description,
        content: source.content,
        category: source.category,
        tags: [...source.tags],
        visibility: "public",
        license: source.license,
      };

      await Prompt.create(
        [
          {
            _id: forkId,
            ...snapshot,
            slug: forkSlug,
            creatorId: user.id,
            currentVersionId: versionId,
            currentVersion: 1,
            publishedAt: new Date(),
            forkedFrom: {
              promptId: source._id,
              versionId: source.currentVersionId,
              creatorId: source.creatorId,
            },
          },
        ],
        { session },
      );
      await PromptVersion.create(
        [
          {
            _id: versionId,
            promptId: forkId,
            versionNumber: 1,
            ...versionPromptSnapshot(snapshot),
            changeSummary: `فورک از نسخه ${source.currentVersion.toLocaleString("fa-IR")}`,
            authorId: user.id,
            parentVersionId: null,
            source: "import",
            contentHash: contentHash(versionPromptSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );
      await Prompt.updateOne(
        { _id: sourceId },
        { $set: { "stats.forks": (source.stats?.forks ?? 0) + 1 } },
        { session },
      );
      await User.updateOne({ _id: user.id }, { $inc: { "stats.prompts": 1 } }, { session });
      await createNotification({
        recipientId: source.creatorId,
        actorId: user.id,
        type: "system",
        title: "پرامپت شما فورک شد",
        body: `یک فورک مستقل از «${source.title}» ساخته شد.`,
        entityModel: "Prompt",
        entityId: forkId,
        href: `/prompts/${forkSlug}`,
        dedupeKey: `prompt-fork:${forkId}`,
        session,
      });
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Prompt", sourceSlug);
  revalidateContent("Prompt", forkSlug);
  revalidatePath(`/users/${user.username ?? ""}`);
  redirect(`/prompts/${forkSlug}`);
}

export async function forkSkillAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const values = formDataObject(formData);
  const parsed = forkSchema.safeParse({ targetId: values.targetId ?? values.skillId });
  if (!parsed.success) return validationState(parsed.error);
  const sourceId = toObjectId(parsed.data.targetId, "شناسه مهارت");
  const forkId = new Types.ObjectId();
  const versionId = new Types.ObjectId();
  let sourceSlug = "";
  let forkSlug = "";

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const source = await Skill.findOne({
        _id: sourceId,
        visibility: "public",
        moderationStatus: "visible",
      }).session(session);
      if (!source || !source.currentVersionId) {
        throw new PublicActionError("این مهارت عمومی نیست یا نسخه رسمی ندارد.");
      }

      sourceSlug = source.slug;
      forkSlug = makeContentSlug(source.name, "skill");
      const snapshot: SkillSnapshot = {
        name: source.name,
        description: source.description,
        instructions: source.instructions,
        requiredKnowledge: [...source.requiredKnowledge],
        workflow: source.workflow.map((step) => ({
          order: step.order,
          title: step.title,
          instruction: step.instruction,
        })),
        tools: [...source.tools],
        dependencies: source.dependencies.map((dependency) => ({
          skillId: dependency.skillId ?? null,
          name: dependency.name,
          versionRange: dependency.versionRange,
          optional: dependency.optional,
        })),
        tags: [...source.tags],
        visibility: "public",
        license: source.license,
      };

      await Skill.create(
        [
          {
            _id: forkId,
            ...snapshot,
            slug: forkSlug,
            creatorId: user.id,
            currentVersionId: versionId,
            currentVersion: 1,
            publishedAt: new Date(),
            forkedFrom: {
              skillId: source._id,
              versionId: source.currentVersionId,
              creatorId: source.creatorId,
            },
          },
        ],
        { session },
      );
      await SkillVersion.create(
        [
          {
            _id: versionId,
            skillId: forkId,
            versionNumber: 1,
            ...versionSkillSnapshot(snapshot),
            changeSummary: `فورک از نسخه ${source.currentVersion.toLocaleString("fa-IR")}`,
            authorId: user.id,
            parentVersionId: null,
            source: "import",
            contentHash: contentHash(versionSkillSnapshot(snapshot)),
            isOfficial: true,
          },
        ],
        { session },
      );
      await Skill.updateOne(
        { _id: sourceId },
        { $set: { "stats.forks": (source.stats?.forks ?? 0) + 1 } },
        { session },
      );
      await User.updateOne({ _id: user.id }, { $inc: { "stats.skills": 1 } }, { session });
      await createNotification({
        recipientId: source.creatorId,
        actorId: user.id,
        type: "system",
        title: "مهارت شما فورک شد",
        body: `یک فورک مستقل از «${source.name}» ساخته شد.`,
        entityModel: "Skill",
        entityId: forkId,
        href: `/skills/${forkSlug}`,
        dedupeKey: `skill-fork:${forkId}`,
        session,
      });
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidateContent("Skill", sourceSlug);
  revalidateContent("Skill", forkSlug);
  revalidatePath(`/users/${user.username ?? ""}`);
  redirect(`/skills/${forkSlug}`);
}

export async function openImprovementRequestAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = improvementRequestSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);

  const targetId = toObjectId(parsed.data.targetId, "شناسه محتوای اصلی");
  const forkId = toObjectId(parsed.data.forkId, "شناسه فورک");
  const baseVersionId = toObjectId(parsed.data.baseVersionId, "شناسه نسخه پایه");
  const requestId = new Types.ObjectId();

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const duplicate = await ImprovementRequest.exists({
        targetType: parsed.data.targetType,
        targetId,
        forkId,
        status: { $in: ["open", "changes-requested"] },
      }).session(session);
      if (duplicate) {
        throw new PublicActionError("برای این فورک یک پیشنهاد فعال وجود دارد.");
      }

      let ownerId: Types.ObjectId;
      let proposedSnapshot: Record<string, unknown>;
      let baseSnapshot: Record<string, unknown>;
      let targetTitle: string;
      let hasBaseConflict = false;

      if (parsed.data.targetType === "Prompt") {
        const [target, fork, baseVersion] = await Promise.all([
          Prompt.findOne({
            _id: targetId,
            visibility: { $in: ["public", "unlisted"] as const },
            moderationStatus: "visible" as const,
          }).session(session),
          Prompt.findOne({ _id: forkId, creatorId: user.id }).session(session),
          PromptVersion.findOne({ _id: baseVersionId, promptId: targetId }).session(session),
        ]);
        if (!target || !fork || !baseVersion) {
          throw new PublicActionError("محتوای اصلی، فورک یا نسخه پایه پیدا نشد.");
        }
        if (
          String(fork.forkedFrom?.promptId ?? "") !== String(targetId) ||
          String(fork.forkedFrom?.versionId ?? "") !== String(baseVersionId)
        ) {
          throw new PublicActionError("این فورک از نسخه پایه انتخاب‌شده ساخته نشده است.");
        }
        ownerId = target.creatorId;
        targetTitle = target.title;
        proposedSnapshot = versionPromptSnapshot({
          title: fork.title,
          description: fork.description,
          content: fork.content,
          category: fork.category,
          tags: [...fork.tags],
          visibility: fork.visibility,
          license: fork.license,
        });
        baseSnapshot = {
          title: baseVersion.title,
          description: baseVersion.description,
          content: baseVersion.content,
          tags: [...baseVersion.tags],
        };
        hasBaseConflict = String(target.currentVersionId ?? "") !== String(baseVersionId);
      } else {
        const [target, fork, baseVersion] = await Promise.all([
          Skill.findOne({
            _id: targetId,
            visibility: { $in: ["public", "unlisted"] as const },
            moderationStatus: "visible" as const,
          }).session(session),
          Skill.findOne({ _id: forkId, creatorId: user.id }).session(session),
          SkillVersion.findOne({ _id: baseVersionId, skillId: targetId }).session(session),
        ]);
        if (!target || !fork || !baseVersion) {
          throw new PublicActionError("محتوای اصلی، فورک یا نسخه پایه پیدا نشد.");
        }
        if (
          String(fork.forkedFrom?.skillId ?? "") !== String(targetId) ||
          String(fork.forkedFrom?.versionId ?? "") !== String(baseVersionId)
        ) {
          throw new PublicActionError("این فورک از نسخه پایه انتخاب‌شده ساخته نشده است.");
        }
        ownerId = target.creatorId;
        targetTitle = target.name;
        proposedSnapshot = versionSkillSnapshot({
          name: fork.name,
          description: fork.description,
          instructions: fork.instructions,
          requiredKnowledge: [...fork.requiredKnowledge],
          workflow: fork.workflow.map((step) => ({
            order: step.order,
            title: step.title,
            instruction: step.instruction,
          })),
          tools: [...fork.tools],
          dependencies: fork.dependencies.map((dependency) => ({
            skillId: dependency.skillId ?? null,
            name: dependency.name,
            versionRange: dependency.versionRange,
            optional: dependency.optional,
          })),
          tags: [...fork.tags],
          visibility: fork.visibility,
          license: fork.license,
        });
        baseSnapshot = {
          name: baseVersion.name,
          description: baseVersion.description,
          instructions: baseVersion.instructions,
          requiredKnowledge: [...baseVersion.requiredKnowledge],
          workflow: baseVersion.workflow.map((step) => ({
            order: step.order,
            title: step.title,
            instruction: step.instruction,
          })),
          tools: [...baseVersion.tools],
          dependencies: baseVersion.dependencies.map((dependency) => ({
            skillId: dependency.skillId ?? null,
            name: dependency.name,
            versionRange: dependency.versionRange,
            optional: dependency.optional,
          })),
          tags: [...baseVersion.tags],
        };
        hasBaseConflict = String(target.currentVersionId ?? "") !== String(baseVersionId);
      }

      if (String(ownerId) === String(user.id)) {
        throw new PublicActionError("مالک محتوا می‌تواند تغییرات را مستقیماً نسخه‌بندی کند.");
      }
      const changedPaths = changedSnapshotPaths(baseSnapshot, proposedSnapshot);
      if (changedPaths.length === 0) {
        throw new PublicActionError("فورک تغییری نسبت به نسخه پایه ندارد.");
      }

      await ImprovementRequest.create(
        [
          {
            _id: requestId,
            targetType: parsed.data.targetType,
            targetId,
            ownerId,
            proposerId: user.id,
            forkId,
            baseVersionModel:
              parsed.data.targetType === "Prompt" ? "PromptVersion" : "SkillVersion",
            baseVersionId,
            title: parsed.data.title,
            summary: parsed.data.summary,
            proposedSnapshot,
            changedPaths,
            status: "open",
            hasBaseConflict,
            submittedAt: new Date(),
            lastActivityAt: new Date(),
          },
        ],
        { session },
      );
      await ImprovementDiscussionMessage.create(
        [
          {
            requestId,
            senderId: null,
            kind: "system",
            content: "پیشنهاد بهبود برای بررسی ارسال شد.",
            readBy: [user.id],
          },
        ],
        { session },
      );
      await createNotification({
        recipientId: ownerId,
        actorId: user.id,
        type: "improvement-opened",
        title: "پیشنهاد بهبود تازه",
        body: `برای «${targetTitle}» یک پیشنهاد بهبود ثبت شد.`,
        entityModel: "ImprovementRequest",
        entityId: requestId,
        href: `/improvements/${requestId}`,
        dedupeKey: `improvement-opened:${requestId}`,
        metadata: { hasBaseConflict },
        session,
      });
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidatePath("/improvements");
  redirect(`/improvements/${requestId}`);
}

export async function addImprovementMessageAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = improvementMessageSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const requestId = toObjectId(parsed.data.requestId, "شناسه پیشنهاد");
  const messageId = new Types.ObjectId();

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const request = await ImprovementRequest.findById(requestId).session(session);
      if (!request) throw new PublicActionError("پیشنهاد بهبود پیدا نشد.");
      const participant =
        String(request.ownerId) === String(user.id) ||
        String(request.proposerId) === String(user.id) ||
        user.roles.includes("admin");
      if (!participant) {
        throw new PublicActionError("فقط طرف‌های این پیشنهاد می‌توانند در گفت‌وگو شرکت کنند.");
      }
      if (!["open", "changes-requested"].includes(request.status)) {
        throw new PublicActionError("گفت‌وگوی این پیشنهاد بسته شده است.");
      }

      await ImprovementDiscussionMessage.create(
        [
          {
            _id: messageId,
            requestId,
            senderId: user.id,
            kind: "message",
            content: parsed.data.content,
            readBy: [user.id],
          },
        ],
        { session },
      );
      await ImprovementRequest.updateOne(
        { _id: requestId },
        { $set: { lastActivityAt: new Date() } },
        { session },
      );

      const recipientId =
        String(request.ownerId) === String(user.id) ? request.proposerId : request.ownerId;
      await createNotification({
        recipientId,
        actorId: user.id,
        type: "improvement-message",
        title: "پیام تازه در پیشنهاد بهبود",
        body: parsed.data.content.slice(0, 300),
        entityModel: "ImprovementRequest",
        entityId: requestId,
        href: `/improvements/${requestId}#message-${messageId}`,
        dedupeKey: `improvement-message:${messageId}`,
        session,
      });
    });
  } catch (error) {
    return actionFailure(error);
  }

  revalidatePath(`/improvements/${requestId}`);
  revalidatePath("/improvements");
  return {
    status: "success",
    message: "پیام ارسال شد.",
    data: { id: String(messageId) },
  };
}
