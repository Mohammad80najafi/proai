"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import type { ActionState } from "@/features/shared/action-state";
import { requireRole } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { ModerationAction, Report } from "@/models/Moderation";
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
