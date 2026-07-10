"use server";

import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { Conversation, ConversationMember } from "@/models/Conversation";
import { Follow } from "@/models/Follow";
import { User } from "@/models/User";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { actionFailure, authIdentity, formDataObject, PublicActionError, validationState } from "@/features/content/mutation-helpers";

const createSchema = z.object({ targetUserId: z.string().refine(Types.ObjectId.isValid) });

export async function createConversationAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const user = authIdentity(await requireUser());
  const parsed = createSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (parsed.data.targetUserId === String(user.id)) return { status: "error", message: "نمی‌توانید با خودتان گفت‌وگو بسازید." };
  const targetId = new Types.ObjectId(parsed.data.targetUserId);
  const directKey = [String(user.id), String(targetId)].sort().join(":");
  let conversationId = "";
  try {
    const database = await connectToDatabase();
    await database.connection.transaction(async (session) => {
      const existing = await Conversation.findOne({ directKey, type: "direct" }).session(session);
      if (existing) { conversationId = String(existing._id); return; }
      const target = await User.findOne({ _id: targetId, accountStatus: "active" }).select("messagingPolicy").session(session);
      if (!target || target.messagingPolicy === "nobody") throw new PublicActionError("این کاربر پیام تازه نمی‌پذیرد.");
      if (target.messagingPolicy === "mutual") {
        const follows = await Follow.countDocuments({ $or: [{ followerId: user.id, followingId: targetId }, { followerId: targetId, followingId: user.id }] }).session(session);
        if (follows < 2) throw new PublicActionError("برای شروع گفت‌وگو باید یکدیگر را دنبال کنید.");
      } else if (target.messagingPolicy === "following") {
        const follows = await Follow.exists({ followerId: targetId, followingId: user.id }).session(session);
        if (!follows) throw new PublicActionError("این کاربر فقط از افرادی که دنبال می‌کند پیام می‌پذیرد.");
      }
      const conversation = await Conversation.create([{ type: "direct", directKey, createdById: user.id }], { session });
      conversationId = String(conversation[0]._id);
      await ConversationMember.create(
        [
          { conversationId, userId: user.id, role: "member" },
          { conversationId, userId: targetId, role: "member" },
        ],
        { session, ordered: true },
      );
    });
  } catch (error) { return actionFailure(error); }
  redirect(`/messages?conversation=${conversationId}`);
}
