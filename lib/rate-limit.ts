import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { connectToDatabase } from "@/lib/db";
import { RateLimit } from "@/models/RateLimit";

type RateLimitOptions = {
  scope: string;
  subject: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function getClientAddress(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "local-or-unknown";
}

/**
 * A Mongo-backed fixed-window limiter. Subjects are hashed before storage so
 * email addresses, user ids, and client addresses are not retained in plain text.
 */
export async function consumeRateLimit({
  scope,
  subject,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  if (limit < 1 || windowMs < 1_000) {
    throw new Error("Invalid rate-limit configuration.");
  }

  await connectToDatabase();
  const now = Date.now();
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const subjectHash = hash(subject);
  const key = hash(`${scope}:${subjectHash}:${windowStartedAt}`);
  const expiresAt = new Date(windowStartedAt + windowMs * 2);

  const entry = await RateLimit.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        scope,
        subjectHash,
        windowStartedAt: new Date(windowStartedAt),
        expiresAt,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: false },
  )
    .lean()
    .exec();

  const count = entry?.count ?? limit + 1;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowStartedAt + windowMs - now) / 1_000),
    ),
  };
}
