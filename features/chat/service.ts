import "server-only";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { Conversation, ConversationMember, Message } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import type { ChatMessage, ChatUser } from "@/features/chat/types";

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
  clientNonce,
}: {
  conversationId: string;
  senderId: string;
  content: string;
  clientNonce?: string | null;
}): Promise<SendMessageResult> {
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(senderId)) {
    throw new Error("Invalid conversation");
  }
  if (typeof content !== "string") throw new Error("Invalid message");

  const clean = content.trim();
  if (!clean || clean.length > 12_000) throw new Error("Invalid message");
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
        type: "text",
        content: clean,
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
        body: clean.slice(0, 300),
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
  if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) return;
  await connectToDatabase();
  const conversation = await Conversation.findById(conversationId)
    .select("lastMessageId")
    .lean<{ lastMessageId?: unknown | null } | null>();
  if (!conversation) return;

  await ConversationMember.updateOne(
    { conversationId, userId, leftAt: null },
    {
      $set: {
        unreadCount: 0,
        lastReadAt: new Date(),
        lastReadMessageId: conversation.lastMessageId ?? null,
      },
    },
  );
}
