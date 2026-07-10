import "server-only";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { ImprovementDiscussionMessage, ImprovementRequest } from "@/models/ImprovementRequest";
import { Prompt } from "@/models/Prompt";
import { Skill } from "@/models/Skill";
import { User } from "@/models/User";
import type { AuthenticatedUserDTO } from "@/lib/auth/dto";

type PublicUser = { _id: unknown; username: string; displayName: string; avatar?: string | null };

export type ImprovementListItem = {
  id: string;
  title: string;
  summary: string;
  status: string;
  targetType: "Prompt" | "Skill";
  targetTitle: string;
  proposer: { username: string; displayName: string; avatar: string | null };
  owner: { username: string; displayName: string; avatar: string | null };
  hasBaseConflict: boolean;
  changedPaths: string[];
  lastActivityAt: string;
};

export type ImprovementDetail = ImprovementListItem & {
  targetId: string;
  targetSlug: string;
  forkId: string;
  baseVersionId: string;
  proposedSnapshot: Record<string, unknown>;
  decisionReason: string;
  isOwner: boolean;
  isProposer: boolean;
  messages: Array<{ id: string; kind: string; content: string; createdAt: string; sender: { username: string; displayName: string; avatar: string | null } | null }>;
};

function safeUser(user?: PublicUser) {
  return user ? { username: user.username, displayName: user.displayName, avatar: user.avatar ?? null } : { username: "deleted-user", displayName: "کاربر حذف‌شده", avatar: null };
}

export async function listImprovements(user: AuthenticatedUserDTO): Promise<ImprovementListItem[]> {
  await connectToDatabase();
  const filter = user.roles.includes("admin") ? {} : { $or: [{ ownerId: user.id }, { proposerId: user.id }] };
  const requests = await ImprovementRequest.find(filter).sort({ lastActivityAt: -1 }).limit(100).lean<Array<{ _id: unknown; title: string; summary: string; status: string; targetType: "Prompt" | "Skill"; targetId: unknown; proposerId: unknown; ownerId: unknown; hasBaseConflict: boolean; changedPaths: string[]; lastActivityAt: Date }>>();
  const userIds = [...new Set(requests.flatMap((item) => [String(item.ownerId), String(item.proposerId)]))];
  const [users, prompts, skills] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("username displayName avatar").lean<PublicUser[]>(),
    Prompt.find({ _id: { $in: requests.filter((item) => item.targetType === "Prompt").map((item) => item.targetId) } }).select("title").lean<Array<{ _id: unknown; title: string }>>(),
    Skill.find({ _id: { $in: requests.filter((item) => item.targetType === "Skill").map((item) => item.targetId) } }).select("name").lean<Array<{ _id: unknown; name: string }>>(),
  ]);
  const userMap = new Map(users.map((item) => [String(item._id), item]));
  const titleMap = new Map<string, string>([...prompts.map((item) => [String(item._id), item.title] as const), ...skills.map((item) => [String(item._id), item.name] as const)]);
  return requests.map((item) => ({
    id: String(item._id), title: item.title, summary: item.summary, status: item.status, targetType: item.targetType,
    targetTitle: titleMap.get(String(item.targetId)) ?? "محتوای حذف‌شده",
    proposer: safeUser(userMap.get(String(item.proposerId))), owner: safeUser(userMap.get(String(item.ownerId))),
    hasBaseConflict: item.hasBaseConflict, changedPaths: item.changedPaths, lastActivityAt: item.lastActivityAt.toISOString(),
  }));
}

export async function getImprovementDetail(requestId: string, user: AuthenticatedUserDTO): Promise<ImprovementDetail | null> {
  if (!Types.ObjectId.isValid(requestId)) return null;
  await connectToDatabase();
  const request = await ImprovementRequest.findById(requestId).lean<{ _id: unknown; title: string; summary: string; status: string; targetType: "Prompt" | "Skill"; targetId: unknown; forkId: unknown; baseVersionId: unknown; proposerId: unknown; ownerId: unknown; proposedSnapshot: Record<string, unknown>; decisionReason: string; hasBaseConflict: boolean; changedPaths: string[]; lastActivityAt: Date } | null>();
  if (!request) return null;
  const isOwner = String(request.ownerId) === user.id || user.roles.includes("admin");
  const isProposer = String(request.proposerId) === user.id;
  if (!isOwner && !isProposer) return null;
  const [users, target, messageRows] = await Promise.all([
    User.find({ _id: { $in: [request.ownerId, request.proposerId] } }).select("username displayName avatar").lean<PublicUser[]>(),
    request.targetType === "Prompt" ? Prompt.findById(request.targetId).select("title slug").lean<{ title: string; slug: string } | null>() : Skill.findById(request.targetId).select("name slug").lean<{ name: string; slug: string } | null>(),
    ImprovementDiscussionMessage.find({ requestId, deletedAt: null }).sort({ createdAt: 1 }).lean<Array<{ _id: unknown; senderId?: unknown | null; kind: string; content: string; createdAt: Date }>>(),
  ]);
  const senderIds = messageRows.map((item) => item.senderId).filter(Boolean).map(String);
  const extraUsers = senderIds.length ? await User.find({ _id: { $in: senderIds } }).select("username displayName avatar").lean<PublicUser[]>() : [];
  const userMap = new Map([...users, ...extraUsers].map((item) => [String(item._id), item]));
  const listItem: ImprovementListItem = {
    id: String(request._id), title: request.title, summary: request.summary, status: request.status, targetType: request.targetType,
    targetTitle: target ? ("title" in target ? target.title : target.name) : "محتوای حذف‌شده",
    proposer: safeUser(userMap.get(String(request.proposerId))), owner: safeUser(userMap.get(String(request.ownerId))),
    hasBaseConflict: request.hasBaseConflict, changedPaths: request.changedPaths, lastActivityAt: request.lastActivityAt.toISOString(),
  };
  return {
    ...listItem,
    targetId: String(request.targetId), targetSlug: target?.slug ?? "", forkId: String(request.forkId), baseVersionId: String(request.baseVersionId),
    proposedSnapshot: request.proposedSnapshot, decisionReason: request.decisionReason, isOwner, isProposer,
    messages: messageRows.map((item) => ({ id: String(item._id), kind: item.kind, content: item.content, createdAt: item.createdAt.toISOString(), sender: item.senderId ? safeUser(userMap.get(String(item.senderId))) : null })),
  };
}
