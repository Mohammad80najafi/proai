import "server-only";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { Conversation, ConversationMember, Message } from "@/models/Conversation";
import { User } from "@/models/User";
import type { ChatConversation, ChatMessage, ChatUser } from "@/features/chat/types";

type RawUser = { _id: unknown; username: string; displayName: string; avatar?: string | null };
const userDTO = (user: RawUser): ChatUser => ({ id: String(user._id), username: user.username, displayName: user.displayName, avatar: user.avatar ?? null });

export async function getConversationList(userId: string): Promise<ChatConversation[]> {
  await connectToDatabase();
  const memberships = await ConversationMember.find({ userId, leftAt: null, archivedAt: null }).sort({ updatedAt: -1 }).lean<Array<{ conversationId: unknown; unreadCount: number }>>();
  if (!memberships.length) return [];
  const ids = memberships.map((item) => String(item.conversationId));
  const [conversations, otherMembers] = await Promise.all([
    Conversation.find({ _id: { $in: ids }, type: "direct", closedAt: null }).sort({ lastMessageAt: -1 }).lean<Array<{ _id: unknown; lastMessageId?: unknown | null; lastMessageAt?: Date | null }>>(),
    ConversationMember.find({ conversationId: { $in: ids }, userId: { $ne: userId }, leftAt: null }).select("conversationId userId").lean<Array<{ conversationId: unknown; userId: unknown }>>(),
  ]);
  const [users, lastMessages] = await Promise.all([
    User.find({ _id: { $in: otherMembers.map((item) => item.userId) } }).select("username displayName avatar").lean<RawUser[]>(),
    Message.find({ _id: { $in: conversations.map((item) => item.lastMessageId).filter(Boolean) } }).select("content image").lean<Array<{ _id: unknown; content: string; image?: { url?: string | null } | null }>>(),
  ]);
  const memberMap = new Map(otherMembers.map((item) => [String(item.conversationId), String(item.userId)]));
  const userMap = new Map(users.map((item) => [String(item._id), userDTO(item)]));
  const messageMap = new Map(lastMessages.map((item) => [String(item._id), item.content || (item.image?.url ? "تصویر" : "گفت‌وگوی تازه")]));
  const unreadMap = new Map(memberships.map((item) => [String(item.conversationId), item.unreadCount]));
  return conversations.flatMap((item) => { const participant = userMap.get(memberMap.get(String(item._id)) ?? ""); return participant ? [{ id: String(item._id), participant, lastMessage: messageMap.get(String(item.lastMessageId)) ?? "گفت‌وگوی تازه", lastMessageAt: (item.lastMessageAt ?? new Date(0)).toISOString(), unreadCount: unreadMap.get(String(item._id)) ?? 0, online: false }] : []; });
}

export async function getUnreadConversationIds(userId: string): Promise<string[]> {
  await connectToDatabase();
  const memberships = await ConversationMember.find({
    userId,
    leftAt: null,
    archivedAt: null,
    unreadCount: { $gt: 0 },
  })
    .select("conversationId")
    .lean<Array<{ conversationId: unknown }>>();
  if (!memberships.length) return [];

  const conversations = await Conversation.find({
    _id: { $in: memberships.map((item) => item.conversationId) },
    type: "direct",
    closedAt: null,
  })
    .select("_id")
    .lean<Array<{ _id: unknown }>>();

  return conversations.map((conversation) => String(conversation._id));
}

export async function getConversationMessages(conversationId: string, userId: string, limit = 80): Promise<{ participant: ChatUser; messages: ChatMessage[] } | null> {
  if (!Types.ObjectId.isValid(conversationId)) return null;
  await connectToDatabase();
  const membership = await ConversationMember.exists({ conversationId, userId, leftAt: null });
  if (!membership) return null;
  const other = await ConversationMember.findOne({ conversationId, userId: { $ne: userId }, leftAt: null }).select("userId").lean<{ userId: unknown } | null>();
  if (!other) return null;
  const [participantRow, rows] = await Promise.all([
    User.findById(other.userId).select("username displayName avatar").lean<RawUser | null>(),
    Message.find({ conversationId, deletedAt: null }).sort({ createdAt: -1 }).limit(Math.min(limit, 150)).lean<Array<{ _id: unknown; senderId?: unknown | null; content: string; image?: { url?: string | null; width?: number | null; height?: number | null } | null; createdAt: Date; clientNonce?: string | null }>>(),
  ]);
  if (!participantRow) return null;
  const senderIds = [...new Set(rows.map((item) => String(item.senderId ?? "")).filter(Boolean))];
  const senders = await User.find({ _id: { $in: senderIds } }).select("username displayName avatar").lean<RawUser[]>();
  const senderMap = new Map(senders.map((item) => [String(item._id), userDTO(item)]));
  return { participant: userDTO(participantRow), messages: rows.reverse().map((item) => ({ id: String(item._id), conversationId, content: item.content, image: item.image?.url ? { url: item.image.url, width: item.image.width ?? null, height: item.image.height ?? null } : null, createdAt: item.createdAt.toISOString(), sender: item.senderId ? senderMap.get(String(item.senderId)) ?? null : null, own: String(item.senderId) === userId, clientNonce: item.clientNonce ?? null })) };
}
