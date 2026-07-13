"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { getNewsStory } from "@/features/news/data";
import type { ActionState } from "@/features/shared/action-state";
import { requireRole } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { makeSlug } from "@/lib/format";
import { ModerationAction, Report } from "@/models/Moderation";
import { NewsArticle } from "@/models/NewsArticle";
import { Prompt } from "@/models/Prompt";
import { Session } from "@/models/Session";
import { Skill } from "@/models/Skill";
import { User } from "@/models/User";

export type AdminActionState = ActionState<string, { id: string }>;

const objectId = z.string().refine(Types.ObjectId.isValid, "شناسه معتبر نیست.");
const userStatusSchema = z.object({
  userId: objectId,
  status: z.enum(["active", "suspended"]),
});
const userRoleSchema = z.object({
  userId: objectId,
  role: z.enum(["user", "moderator", "admin"]),
});
const contentStatusSchema = z.object({
  targetId: objectId,
  targetType: z.enum(["Prompt", "Skill"]),
  status: z.enum(["visible", "under-review", "removed"]),
});
const reportResolutionSchema = z.object({
  reportId: objectId,
  decision: z.enum(["resolved", "dismissed"]),
  resolution: z.string().trim().max(2_000).default(""),
});
const newsEditorSchema = z.object({
  slug: z.string().trim().max(180).default(""),
  title: z.string().trim().min(5, "عنوان باید دست‌کم ۵ نویسه باشد.").max(220),
  summary: z.string().trim().min(10, "خلاصه باید دست‌کم ۱۰ نویسه باشد.").max(1_200),
  category: z.string().trim().min(2).max(80),
  source: z.string().trim().min(2).max(100),
  sourceUrl: z.url("پیوند منبع معتبر نیست.").max(2_048),
  coverImage: z.string().trim().regex(/^\/(?:images|uploads)\/news\/[a-z0-9._/-]+$/i, "مسیر تصویر باید از پوشه news باشد."),
  readTimeMinutes: z.coerce.number().int().min(1).max(120),
  status: z.enum(["draft", "published"]),
  featured: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
  accentTheme: z.enum(["mint", "sky", "amber", "violet"]),
  publishedAt: z.string().trim().default(""),
  sectionHeading1: z.string().trim().min(2).max(180),
  sectionParagraphs1: z.string().trim().min(10).max(24_000),
  sectionHeading2: z.string().trim().max(180).default(""),
  sectionParagraphs2: z.string().trim().max(24_000).default(""),
  takeaways: z.string().trim().max(4_000).default(""),
});
const updateNewsSchema = newsEditorSchema.extend({
  originalSlug: z.string().trim().min(1).max(180),
});
const deleteNewsSchema = z.object({ slug: z.string().trim().min(1).max(180) });

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function invalid(error: z.ZodError): AdminActionState {
  return {
    status: "error",
    message: "اطلاعات عملیات معتبر نیست.",
    errors: error.flatten().fieldErrors,
  };
}

function failed(error: unknown): AdminActionState {
  console.error("Admin action failed", error);
  return {
    status: "error",
    message: "عملیات انجام نشد. دوباره تلاش کنید.",
  };
}

function newsSections(input: z.infer<typeof newsEditorSchema>) {
  const paragraphs = (value: string) => value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  return [
    { heading: input.sectionHeading1, paragraphs: paragraphs(input.sectionParagraphs1) },
    ...(input.sectionHeading2 && input.sectionParagraphs2
      ? [{ heading: input.sectionHeading2, paragraphs: paragraphs(input.sectionParagraphs2) }]
      : []),
  ];
}

function newsTakeaways(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function newsPayload(input: z.infer<typeof newsEditorSchema>, slug: string, authorId: string) {
  const requestedDate = input.publishedAt ? new Date(input.publishedAt) : new Date();
  const publishedAt = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  return {
    slug,
    title: input.title,
    summary: input.summary,
    category: input.category,
    source: input.source,
    sourceUrl: input.sourceUrl,
    coverImage: input.coverImage,
    readTimeMinutes: input.readTimeMinutes,
    sections: newsSections(input),
    takeaways: newsTakeaways(input.takeaways),
    status: input.status,
    featured: input.featured,
    accentTheme: input.accentTheme,
    authorId: new Types.ObjectId(authorId),
    publishedAt: input.status === "published" ? publishedAt : null,
    deletedAt: null,
  };
}

export async function updateUserStatusAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = userStatusSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.userId === admin.id) {
    return { status: "error", message: "نمی‌توانید وضعیت حساب خودتان را تغییر دهید." };
  }

  try {
    const database = await connectToDatabase();
    const targetId = new Types.ObjectId(parsed.data.userId);
    await database.connection.transaction(async (session) => {
      const target = await User.findById(targetId)
        .select("accountStatus")
        .session(session);
      if (!target || target.accountStatus === "deleted") {
        throw new Error("Target user is unavailable");
      }
      await User.updateOne(
        { _id: targetId, accountStatus: { $ne: "deleted" } },
        { $set: { accountStatus: parsed.data.status } },
        { session },
      );
      if (parsed.data.status === "suspended") {
        await Session.updateMany(
          { userId: targetId, revokedAt: null },
          { $set: { revokedAt: new Date() } },
          { session },
        );
      }
      await ModerationAction.create(
        [
          {
            moderatorId: admin.id,
            targetModel: "User",
            targetId,
            action: "user-status-updated",
            note: parsed.data.status === "suspended" ? "تعلیق حساب کاربری" : "فعال‌سازی دوباره حساب",
            metadata: { from: target.accountStatus, to: parsed.data.status },
          },
        ],
        { session },
      );
    });
  } catch (error) {
    return failed(error);
  }

  revalidatePath("/admin");
  return {
    status: "success",
    message: parsed.data.status === "suspended" ? "حساب تعلیق شد." : "حساب فعال شد.",
    data: { id: parsed.data.userId },
  };
}

export async function updateUserRoleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = userRoleSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.userId === admin.id) {
    return { status: "error", message: "نقش مدیریتی حساب خودتان قابل تغییر نیست." };
  }

  const roles = parsed.data.role === "admin"
    ? ["user", "moderator", "admin"]
    : parsed.data.role === "moderator"
      ? ["user", "moderator"]
      : ["user"];
  try {
    const database = await connectToDatabase();
    const targetId = new Types.ObjectId(parsed.data.userId);
    await database.connection.transaction(async (session) => {
      const target = await User.findOne({ _id: targetId, accountStatus: { $ne: "deleted" } })
        .select("roles")
        .session(session);
      if (!target) throw new Error("Target user is unavailable");
      await User.updateOne({ _id: targetId }, { $set: { roles } }, { session });
      await ModerationAction.create(
        [
          {
            moderatorId: admin.id,
            targetModel: "User",
            targetId,
            action: "user-role-updated",
            note: `تغییر سطح دسترسی به ${parsed.data.role}`,
            metadata: { from: target.roles, to: roles },
          },
        ],
        { session },
      );
    });
  } catch (error) {
    return failed(error);
  }

  revalidatePath("/admin");
  return {
    status: "success",
    message: "سطح دسترسی به‌روزرسانی شد.",
    data: { id: parsed.data.userId },
  };
}

export async function updateContentStatusAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = contentStatusSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const database = await connectToDatabase();
    const targetId = new Types.ObjectId(parsed.data.targetId);
    let slug = "";
    await database.connection.transaction(async (session) => {
      const target = parsed.data.targetType === "Prompt"
        ? await Prompt.findById(targetId).select("slug moderationStatus").session(session)
        : await Skill.findById(targetId).select("slug moderationStatus").session(session);
      if (!target) throw new Error("Target content is unavailable");
      slug = target.slug;
      if (parsed.data.targetType === "Prompt") {
        await Prompt.updateOne(
          { _id: targetId },
          { $set: { moderationStatus: parsed.data.status } },
          { session },
        );
      } else {
        await Skill.updateOne(
          { _id: targetId },
          { $set: { moderationStatus: parsed.data.status } },
          { session },
        );
      }
      await ModerationAction.create(
        [
          {
            moderatorId: admin.id,
            targetModel: parsed.data.targetType,
            targetId,
            action: "content-status-updated",
            note: `تغییر وضعیت محتوا به ${parsed.data.status}`,
            metadata: { from: target.moderationStatus, to: parsed.data.status },
          },
        ],
        { session },
      );
    });
    const segment = parsed.data.targetType === "Prompt" ? "prompts" : "skills";
    revalidatePath(`/${segment}/${slug}`);
  } catch (error) {
    return failed(error);
  }

  revalidatePath("/admin");
  revalidatePath("/explore");
  return {
    status: "success",
    message: "وضعیت محتوا به‌روزرسانی شد.",
    data: { id: parsed.data.targetId },
  };
}

export async function resolveReportAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = reportResolutionSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const database = await connectToDatabase();
    const reportId = new Types.ObjectId(parsed.data.reportId);
    await database.connection.transaction(async (session) => {
      const report = await Report.findOne({ _id: reportId, status: { $in: ["open", "reviewing"] } })
        .select("status")
        .session(session);
      if (!report) throw new Error("Report is already closed or unavailable");
      await Report.updateOne(
        { _id: reportId },
        {
          $set: {
            status: parsed.data.decision,
            resolution: parsed.data.resolution,
            assignedToId: new Types.ObjectId(admin.id),
            resolvedAt: new Date(),
          },
        },
        { session },
      );
      await ModerationAction.create(
        [
          {
            moderatorId: admin.id,
            targetModel: "Report",
            targetId: reportId,
            action: parsed.data.decision === "resolved" ? "report-resolved" : "report-dismissed",
            note: parsed.data.resolution,
            metadata: { from: report.status, to: parsed.data.decision },
          },
        ],
        { session },
      );
    });
  } catch (error) {
    return failed(error);
  }

  revalidatePath("/admin");
  return {
    status: "success",
    message: parsed.data.decision === "resolved" ? "گزارش رسیدگی شد." : "گزارش رد شد.",
    data: { id: parsed.data.reportId },
  };
}

export async function createNewsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = newsEditorSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  const slug = parsed.data.slug || makeSlug(parsed.data.title);
  if (!slug) return { status: "error", message: "برای خبر یک شناسه معتبر وارد کنید." };
  if (await getNewsStory(slug, { includeDrafts: true })) {
    return { status: "error", message: "خبری با این شناسه از قبل وجود دارد." };
  }

  try {
    const database = await connectToDatabase();
    const articleId = new Types.ObjectId();
    await database.connection.transaction(async (session) => {
      await NewsArticle.create(
        [{ _id: articleId, ...newsPayload(parsed.data, slug, admin.id) }],
        { session },
      );
      await ModerationAction.create(
        [{ moderatorId: admin.id, targetModel: "NewsArticle", targetId: articleId, action: "news-created", note: parsed.data.title }],
        { session },
      );
    });
    revalidatePath("/");
    revalidatePath(`/news/${slug}`);
    revalidatePath("/admin");
    return { status: "success", message: "خبر ساخته شد.", data: { id: slug } };
  } catch (error) {
    return failed(error);
  }
}

export async function updateNewsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = updateNewsSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  const existing = await getNewsStory(parsed.data.originalSlug, { includeDrafts: true });
  if (!existing) return { status: "error", message: "خبر برای ویرایش پیدا نشد." };

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const managed = await NewsArticle.findOne({ slug: parsed.data.originalSlug })
        .select("_id")
        .session(session);
      const articleId = managed?._id ?? new Types.ObjectId();
      await NewsArticle.updateOne(
        { slug: parsed.data.originalSlug },
        {
          $set: newsPayload(parsed.data, parsed.data.originalSlug, admin.id),
          $setOnInsert: { _id: articleId },
        },
        { upsert: true, session },
      );
      await ModerationAction.create(
        [{ moderatorId: admin.id, targetModel: "NewsArticle", targetId: articleId, action: "news-updated", note: parsed.data.title }],
        { session },
      );
    });
    revalidatePath("/");
    revalidatePath(`/news/${parsed.data.originalSlug}`);
    revalidatePath("/admin");
    return { status: "success", message: "خبر به‌روزرسانی شد.", data: { id: parsed.data.originalSlug } };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteNewsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole("admin");
  const parsed = deleteNewsSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  const existing = await getNewsStory(parsed.data.slug, { includeDrafts: true });
  if (!existing) return { status: "error", message: "خبر پیدا نشد." };

  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const managed = await NewsArticle.findOne({ slug: parsed.data.slug })
        .select("_id")
        .session(session);
      const articleId = managed?._id ?? new Types.ObjectId();
      const tombstonePayload = newsPayload(
        {
          slug: existing.slug,
          title: existing.title,
          summary: existing.summary,
          category: existing.category,
          source: existing.source,
          sourceUrl: existing.sourceUrl,
          coverImage: existing.coverImage,
          readTimeMinutes: 5,
          status: "draft",
          featured: false,
          accentTheme: existing.accentTheme ?? "mint",
          publishedAt: "",
          sectionHeading1: existing.sections[0]?.heading ?? "متن خبر",
          sectionParagraphs1: existing.sections[0]?.paragraphs.join("\n\n") ?? existing.summary,
          sectionHeading2: existing.sections[1]?.heading ?? "",
          sectionParagraphs2: existing.sections[1]?.paragraphs.join("\n\n") ?? "",
          takeaways: existing.takeaways.join("\n"),
        },
        existing.slug,
        admin.id,
      );
      const tombstoneInsert = Object.fromEntries(
        Object.entries(tombstonePayload).filter(([key]) => key !== "deletedAt" && key !== "status"),
      );
      await NewsArticle.updateOne(
        { slug: parsed.data.slug },
        {
          $set: {
            deletedAt: new Date(),
            status: "draft",
          },
          $setOnInsert: {
            _id: articleId,
            ...tombstoneInsert,
          },
        },
        { upsert: true, session },
      );
      await ModerationAction.create(
        [{ moderatorId: admin.id, targetModel: "NewsArticle", targetId: articleId, action: "news-deleted", note: existing.title }],
        { session },
      );
    });
    revalidatePath("/");
    revalidatePath(`/news/${parsed.data.slug}`);
    revalidatePath("/admin");
    return { status: "success", message: "خبر حذف شد.", data: { id: parsed.data.slug } };
  } catch (error) {
    return failed(error);
  }
}
