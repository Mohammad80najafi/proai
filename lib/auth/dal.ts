import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import {
  type AuthenticatedUserDTO,
  type AuthRole,
} from "@/lib/auth/dto";
import { AuthorizationError } from "@/lib/auth/errors";
import { getRawSessionToken } from "@/lib/auth/session";
import { validateSessionToken } from "@/lib/auth/session-validation";

export const getOptionalUser = cache(
  async (): Promise<AuthenticatedUserDTO | null> => {
    const rawToken = await getRawSessionToken();
    return rawToken ? validateSessionToken(rawToken) : null;
  },
);

export async function requireUser(): Promise<AuthenticatedUserDTO> {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(
  required: AuthRole | readonly AuthRole[],
): Promise<AuthenticatedUserDTO> {
  const user = await requireUser();
  const requiredRoles = Array.isArray(required) ? required : [required];

  if (!requiredRoles.some((role) => user.roles.includes(role))) {
    throw new AuthorizationError();
  }

  return user;
}

