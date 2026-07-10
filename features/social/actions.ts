"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { Follow } from "@/models/Follow";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { createNotification } from "@/features/content/mutation-services";
import { actionFailure, authIdentity, formDataObject, PublicActionError, toObjectId, validationState, type ContentActionState } from "@/features/content/mutation-helpers";

const followSchema = z.object({ userId: z.string().refine(Types.ObjectId.isValid) });

export async function toggleFollowAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = followSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  const followingId = toObjectId(parsed.data.userId, "شناسه کاربر");
  if (String(followingId) === String(user.id)) return { status: "error", message: "نمی‌توانید خودتان را دنبال کنید." };
  let active = false;
  let username = "";
  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const target = await User.findOne({ _id: followingId, accountStatus: "active" }).select("username displayName").session(session);
      if (!target) throw new PublicActionError("کاربر پیدا نشد.");
      username = target.username;
      const existing = await Follow.findOne({ followerId: user.id, followingId }).session(session);
      if (existing) {
        await existing.deleteOne({ session });
        await Promise.all([
          User.updateOne({ _id: user.id }, { $inc: { "stats.following": -1 } }, { session }),
          User.updateOne({ _id: followingId }, { $inc: { "stats.followers": -1 } }, { session }),
        ]);
      } else {
        await Follow.create([{ followerId: user.id, followingId }], { session });
        await Promise.all([
          User.updateOne({ _id: user.id }, { $inc: { "stats.following": 1 } }, { session }),
          User.updateOne({ _id: followingId }, { $inc: { "stats.followers": 1 } }, { session }),
        ]);
        active = true;
        await createNotification({ recipientId: followingId, actorId: user.id, type: "follow", title: "دنبال‌کننده تازه", body: `${user.username ?? "یک کاربر"} شما را دنبال کرد.`, entityModel: "User", entityId: user.id, href: `/users/${user.username}`, dedupeKey: `follow:${followingId}:${user.id}`, session });
      }
    });
  } catch (error) { return actionFailure(error); }
  revalidatePath(`/users/${username}`);
  revalidatePath(`/users/${user.username}`);
  return { status: "success", message: active ? "کاربر را دنبال کردید." : "دنبال‌کردن متوقف شد.", data: { active } };
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = authIdentity(await requireUser());
  await connectToDatabase();
  await Notification.updateMany({ recipientId: user.id, readAt: null }, { $set: { readAt: new Date() } });
  revalidatePath("/notifications");
}
