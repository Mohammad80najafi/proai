import "server-only";

import { connectToDatabase } from "@/lib/db";
import {
  toAuthenticatedUserDTO,
  type SafeSessionUser,
} from "@/lib/auth/dto";
import { hashSessionToken, isSessionToken } from "@/lib/auth/token";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

/**
 * Validates a raw opaque token without relying on Next request APIs. This is
 * suitable for Route Handlers and the realtime gateway as well as the DAL.
 */
export async function validateSessionToken(
  rawToken: string,
): Promise<SafeSessionUser | null> {
  if (!isSessionToken(rawToken)) {
    return null;
  }

  await connectToDatabase();

  const session = await Session.findOne({
    tokenHash: hashSessionToken(rawToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("userId")
    .lean()
    .exec();

  if (!session) {
    return null;
  }

  const user = await User.findOne({
    _id: session.userId,
    accountStatus: "active",
  })
    .select(
      "username displayName avatar roles reputationScore rank accountStatus",
    )
    .lean()
    .exec();

  return user ? toAuthenticatedUserDTO(user) : null;
}

