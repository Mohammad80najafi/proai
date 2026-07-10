import "server-only";

import type { ClientSession } from "mongoose";

import { Notification, notificationTypes } from "@/models/Notification";
import { ReputationEvent, reputationReasons } from "@/models/Reputation";
import { User } from "@/models/User";

import { rankForScore, toObjectId } from "./mutation-helpers";

type NotificationType = (typeof notificationTypes)[number];
type ReputationReason = (typeof reputationReasons)[number];
type NotificationEntity =
  | "User"
  | "Prompt"
  | "Skill"
  | "Comment"
  | "ImprovementRequest"
  | "Conversation"
  | "Message"
  | "Achievement";
type ReputationTarget =
  | "Prompt"
  | "Skill"
  | "Comment"
  | "ImprovementRequest"
  | "Achievement";

export async function createNotification({
  recipientId,
  actorId,
  type,
  title,
  body = "",
  entityModel,
  entityId,
  href,
  dedupeKey,
  metadata = {},
  session,
}: {
  recipientId: unknown;
  actorId?: unknown;
  type: NotificationType;
  title: string;
  body?: string;
  entityModel?: NotificationEntity;
  entityId?: unknown;
  href: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
  session: ClientSession;
}) {
  const recipient = toObjectId(recipientId, "شناسه دریافت‌کننده");
  const actor = actorId ? toObjectId(actorId, "شناسه فرستنده") : null;
  if (actor && String(actor) === String(recipient)) return;

  const document = {
    recipientId: recipient,
    actorId: actor,
    type,
    title,
    body,
    entityModel: entityModel ?? null,
    entityId: entityId ? toObjectId(entityId, "شناسه اعلان") : null,
    href,
    metadata,
    dedupeKey: dedupeKey ?? null,
  };

  if (dedupeKey) {
    await Notification.updateOne(
      { recipientId: recipient, dedupeKey },
      { $setOnInsert: document },
      { upsert: true, session },
    );
    return;
  }

  await Notification.create([document], { session });
}

export async function awardReputation({
  userId,
  actorId,
  reason,
  points,
  targetModel,
  targetId,
  description,
  dedupeKey,
  metadata = {},
  session,
}: {
  userId: unknown;
  actorId?: unknown;
  reason: ReputationReason;
  points: number;
  targetModel: ReputationTarget;
  targetId: unknown;
  description: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
  session: ClientSession;
}) {
  const existing = await ReputationEvent.exists({ dedupeKey }).session(session);
  if (existing) return false;

  const recipient = toObjectId(userId, "شناسه کاربر");
  const user = await User.findById(recipient)
    .select("reputationScore")
    .session(session);
  if (!user) return false;

  const score = Math.max(0, (user.reputationScore ?? 0) + points);
  await User.updateOne(
    { _id: recipient },
    { $set: { reputationScore: score, rank: rankForScore(score) } },
    { session },
  );
  await ReputationEvent.create(
    [
      {
        userId: recipient,
        actorId: actorId ? toObjectId(actorId, "شناسه عامل") : null,
        reason,
        points,
        balanceAfter: score,
        targetModel,
        targetId: toObjectId(targetId, "شناسه هدف"),
        description,
        dedupeKey,
        metadata,
      },
    ],
    { session },
  );
  return true;
}
