import "server-only";

import { userRanks, userRoles } from "@/models/User";

export type AuthRole = (typeof userRoles)[number];
export type AuthRank = (typeof userRanks)[number];

export type AuthenticatedUserDTO = Readonly<{
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  roles: readonly AuthRole[];
  reputationScore: number;
  rank: AuthRank;
}>;

export type SafeSessionUser = AuthenticatedUserDTO;

type AuthUserRecord = {
  _id: { toString(): string };
  username: string;
  displayName: string;
  avatar?: string | null;
  roles: AuthRole[];
  reputationScore: number;
  rank: AuthRank;
};

export function toAuthenticatedUserDTO(
  user: AuthUserRecord,
): AuthenticatedUserDTO {
  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? null,
    roles: [...user.roles],
    reputationScore: user.reputationScore,
    rank: user.rank,
  };
}

