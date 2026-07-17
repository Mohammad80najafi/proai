import "server-only";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { MESSAGE_IMAGE_URL_PATTERN } from "@/lib/upload-paths";
import { Conversation, ConversationMember, Message } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import type { ChatImageAttachment, ChatMessage, ChatUser } from "@/features/chat/types";

export type SendMessageResult = {
  message: ChatMessage;
  recipientIds: string[];
  created: boolean;
};

function publicUser(value: {
  _id: unknown;
  username: string;
  displayName: string;
  avatar?: string | null;
}): ChatUser {
  return {
    id: String(value._id),
    username: value.username,
    displayName: value.displayName,
    avatar: value.avatar ?? null,
  };
}

export async function isConversationMember(conversationId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) return false;
  await connectToDatabase();
  return Boolean(await ConversationMember.exists({ conversationId, userId, leftAt: null }));
}

export async function sendMessage({
  conversationId,
  senderId,
  content,
  image,
  clientNonce,
}: {
  conversationId: string;
  senderId: string;
  content: string;
  image?: ChatImageAttachment | null;
  clientNonce?: string | null;
}): Promise<SendMessageResult> {
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(senderId)) {
    throw new Error("Invalid conversation");
  }
  if (typeof content !== "string") throw new Error("Invalid message");

  const clean = content.trim();
  if ((!clean && !image) || clean.length > 12_000) throw new Error("Invalid message");
  const cleanImage = image
    ? {
        url: image.url,
        width: image.width ?? null,
        height: image.height ?? null,
      }
    : null;
  if (cleanImage && !MESSAGE_IMAGE_URL_PATTERN.test(cleanImage.url)) {
    throw new Error("Invalid image");
  }
  if (clientNonce !== undefined && clientNonce !== null && typeof clientNonce !== "string") {
    throw new Error("Invalid nonce");
  }
  const cleanNonce = clientNonce?.trim() || null;
  if (cleanNonce && cleanNonce.length > 80) throw new Error("Invalid nonce");

  const [minuteLimit, dailyLimit] = await Promise.all([
    consumeRateLimit({
      scope: "chat:send:minute",
      subject: senderId,
      limit: 60,
      windowMs: 60 * 1_000,
    }),
    consumeRateLimit({
      scope: "chat:send:daily",
      subject: senderId,
      limit: 1_000,
      windowMs: 24 * 60 * 60 * 1_000,
    }),
  ]);
  if (!minuteLimit.allowed || !dailyLimit.allowed) {
    throw new Error("Message rate limit exceeded");
  }

  const database = await connectToDatabase();
  let result: SendMessageResult | null = null;

  await database.connection.transaction(async (session) => {
    // Validate the conversation and its complete active membership before any
    // message write. A direct conversation must remain exactly two-party.
    const conversation = await Conversation.findOne({ _id: conversationId, closedAt: null })
      .select("type")
      .session(session);
    if (!conversation) throw new Error("Conversation unavailable");

    const members = await ConversationMember.find({ conversationId, leftAt: null })
      .select("userId")
      .session(session);
    const memberIds = members.map((member) => String(member.userId));
    const uniqueMemberIds = new Set(memberIds);
    const hasValidMemberCount = conversation.type === "direct"
      ? memberIds.length === 2
      : memberIds.length >= 2;

    if (
      !hasValidMemberCount ||
      uniqueMemberIds.size !== memberIds.length ||
      !uniqueMemberIds.has(senderId)
    ) {
      throw new Error("Invalid conversation membership");
    }

    const activeUsers = await User.find({
      _id: { $in: memberIds },
      accountStatus: "active",
    })
      .select("username displayName avatar accountStatus")
      .session(session);
    if (activeUsers.length !== memberIds.length) {
      throw new Error("Invalid conversation member");
    }

    const sender = activeUsers.find((user) => String(user._id) === senderId);
    const recipientIds = memberIds.filter((memberId) => memberId !== senderId);
    if (!sender || recipientIds.length === 0) throw new Error("Forbidden");

    if (cleanNonce) {
      const existing = await Message.findOne({
        conversationId,
        senderId,
        clientNonce: cleanNonce,
      }).session(session);
      if (existing) {
        result = {
          message: {
            id: String(existing._id),
            conversationId,
            content: existing.content,
            image: existing.image?.url ? {
              url: existing.image.url,
              width: existing.image.width ?? null,
              height: existing.image.height ?? null,
            } : null,
            createdAt: existing.createdAt.toISOString(),
            sender: publicUser(sender),
            own: true,
            clientNonce: existing.clientNonce ?? null,
          },
          recipientIds,
          created: false,
        };
        return;
      }
    }

    const messageId = new Types.ObjectId();
    const now = new Date();
    await Message.create(
      [{
        _id: messageId,
        conversationId,
        senderId,
        type: cleanImage ? "image" : "text",
        content: clean,
        image: cleanImage ?? undefined,
        clientNonce: cleanNonce,
        readBy: [senderId],
      }],
      { session },
    );

    const conversationUpdate = await Conversation.updateOne(
      { _id: conversationId, closedAt: null },
      { $set: { lastMessageId: messageId, lastMessageAt: now } },
      { session },
    );
    if (conversationUpdate.matchedCount !== 1) {
      throw new Error("Conversation unavailable");
    }

    const senderUpdate = await ConversationMember.updateOne(
      { conversationId, userId: senderId, leftAt: null },
      { $set: { lastReadMessageId: messageId, lastReadAt: now } },
      { session },
    );
    if (senderUpdate.matchedCount !== 1) {
      throw new Error("Invalid sender membership");
    }

    const recipientUpdate = await ConversationMember.updateMany(
      { conversationId, userId: { $in: recipientIds }, leftAt: null },
      { $inc: { unreadCount: 1 } },
      { session },
    );
    if (recipientUpdate.matchedCount !== recipientIds.length) {
      throw new Error("Invalid recipient membership");
    }

    await Notification.insertMany(
      recipientIds.map((recipientId) => ({
        recipientId,
        actorId: senderId,
        type: "message",
        title: `پیام تازه از ${sender.displayName}`,
        body: clean.slice(0, 300) || "تصویر",
        entityModel: "Conversation",
        entityId: conversationId,
        href: `/messages?conversation=${conversationId}`,
        dedupeKey: `message:${messageId}:${recipientId}`,
      })),
      { session },
    );

    result = {
      message: {
        id: String(messageId),
        conversationId,
        content: clean,
        image: cleanImage,
        createdAt: now.toISOString(),
        sender: publicUser(sender),
        own: true,
        clientNonce: cleanNonce,
      },
      recipientIds,
      created: true,
    };
  });

  if (!result) throw new Error("Message was not created");
  return result;
}

export async function markConversationRead(conversationId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
    return { notificationsRead: 0 };
  }
  await connectToDatabase();
  const conversation = await Conversation.findById(conversationId)
    .select("lastMessageId")
    .lean<{ lastMessageId?: unknown | null } | null>();
  if (!conversation) return { notificationsRead: 0 };

  const now = new Date();
  const [, notificationUpdate] = await Promise.all([
    ConversationMember.updateOne(
      { conversationId, userId, leftAt: null },
      {
        $set: {
          unreadCount: 0,
          lastReadAt: now,
          lastReadMessageId: conversation.lastMessageId ?? null,
        },
      },
    ),
    Notification.updateMany(
      {
        recipientId: userId,
        type: "message",
        entityModel: "Conversation",
        entityId: conversationId,
        readAt: null,
      },
      { $set: { readAt: now } },
    ),
  ]);

  return { notificationsRead: notificationUpdate.modifiedCount };
}
