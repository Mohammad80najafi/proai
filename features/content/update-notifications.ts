import "server-only";

import { Types, type ClientSession } from "mongoose";

import { Follow } from "@/models/Follow";
import { Save } from "@/models/Interaction";
import { Notification } from "@/models/Notification";

type AudienceRow = { followerId?: unknown; userId?: unknown };

export async function notifyContentUpdateAudience({
  targetType,
  targetId,
  creatorId,
  actorId,
  slug,
  title,
  version,
  session,
}: {
  targetType: "Prompt" | "Skill";
  targetId: unknown;
  creatorId: unknown;
  actorId: unknown;
  slug: string;
  title: string;
  version: number | string;
  session: ClientSession;
}) {
  const targetObjectId = new Types.ObjectId(String(targetId));
  const creatorObjectId = new Types.ObjectId(String(creatorId));
  const followers = await Follow.find({ followingId: creatorObjectId })
    .select("followerId")
    .session(session)
    .lean<AudienceRow[]>();
  const savers = await Save.find({ targetType, targetId: targetObjectId })
    .select("userId")
    .session(session)
    .lean<AudienceRow[]>();
  const saverIds = new Set(savers.map((row) => String(row.userId ?? "")));
  const audience = new Map<string, Types.ObjectId>();

  for (const value of [
    ...followers.map((row) => row.followerId),
    ...savers.map((row) => row.userId),
  ]) {
    const recipient = String(value ?? "");
    if (
      !Types.ObjectId.isValid(recipient) ||
      recipient === String(actorId) ||
      recipient === String(creatorId)
    ) {
      continue;
    }
    audience.set(recipient, new Types.ObjectId(recipient));
  }

  if (audience.size === 0) return;

  const kindLabel = targetType === "Prompt" ? "پرامپت" : "مهارت";
  const href = `/${targetType === "Prompt" ? "prompts" : "skills"}/${slug}`;
  const entityId = targetObjectId;
  const normalizedActorId = Types.ObjectId.isValid(String(actorId))
    ? new Types.ObjectId(String(actorId))
    : null;

  await Notification.bulkWrite(
    [...audience].map(([recipient, recipientId]) => {
      const saved = saverIds.has(recipient);
      return {
        updateOne: {
          filter: {
            recipientId,
            dedupeKey: `content-update:${targetType}:${entityId}:${version}`,
          },
          update: {
            $setOnInsert: {
              recipientId,
              actorId: normalizedActorId,
              type: "content-updated",
              title: `${kindLabel} «${title}» به‌روزرسانی شد`,
              body: saved
                ? `محتوای ذخیره‌شده شما اکنون نسخه ${version} است. نسخه تازه را ببینید.`
                : `یکی از سازندگانی که دنبال می‌کنید نسخه ${version} را منتشر کرد.`,
              entityModel: targetType,
              entityId,
              href,
              metadata: { targetType, version, saved },
              dedupeKey: `content-update:${targetType}:${entityId}:${version}`,
              readAt: null,
            },
          },
          upsert: true,
        },
      };
    }),
    { session },
  );
}
