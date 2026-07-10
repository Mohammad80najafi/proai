import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants";
import { connectToDatabase } from "@/lib/db";
import {
  generateSessionToken,
  hashSessionToken,
  isSessionToken,
} from "@/lib/auth/token";
import { Session } from "@/models/Session";

type SessionMetadata = {
  userAgent?: string | null;
};

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  priority: "high" as const,
};

export async function createSession(
  userId: string,
  metadata: SessionMetadata = {},
): Promise<void> {
  const rawToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await connectToDatabase();
  await Session.create({
    userId,
    tokenHash: hashSessionToken(rawToken),
    expiresAt,
    lastSeenAt: new Date(),
    userAgent: metadata.userAgent?.slice(0, 512) ?? "",
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export async function getRawSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return value && isSessionToken(value) ? value : null;
}

/** Revokes only the session represented by the caller's cookie. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken && isSessionToken(rawToken)) {
    try {
      await connectToDatabase();
      await Session.updateOne(
        { tokenHash: hashSessionToken(rawToken), revokedAt: null },
        { $set: { revokedAt: new Date() } },
      ).exec();
    } catch (error) {
      // Clearing the browser credential must still succeed during a DB outage.
      console.error("Failed to revoke the current database session.", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

