import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { Types } from "mongoose";
import { type ZodError } from "zod";

import type { ActionState } from "@/features/shared/action-state";
import { REPUTATION_RANKS } from "@/lib/constants";

export class PublicActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicActionError";
  }
}

export type ActionData = {
  id?: string;
  slug?: string;
  active?: boolean;
  count?: number;
  rating?: number;
  ratingCount?: number;
  status?: string;
};

export type ContentActionState = ActionState<string, ActionData>;

export type AuthIdentity = {
  id: Types.ObjectId;
  roles: string[];
  username?: string;
};

export function authIdentity(value: unknown): AuthIdentity {
  const user = value as {
    id?: unknown;
    _id?: unknown;
    roles?: unknown;
    username?: unknown;
  };
  const rawId = user.id ?? user._id;

  if (!Types.ObjectId.isValid(String(rawId ?? ""))) {
    throw new PublicActionError("نشست کاربری معتبر نیست. دوباره وارد شوید.");
  }

  return {
    id: new Types.ObjectId(String(rawId)),
    roles: Array.isArray(user.roles)
      ? user.roles.filter((role): role is string => typeof role === "string")
      : [],
    username: typeof user.username === "string" ? user.username : undefined,
  };
}

export function canManage(ownerId: unknown, user: AuthIdentity) {
  return String(ownerId) === String(user.id) || user.roles.includes("admin");
}

export function toObjectId(value: unknown, label = "شناسه") {
  const stringValue = String(value ?? "");
  if (!Types.ObjectId.isValid(stringValue)) {
    throw new PublicActionError(`${label} معتبر نیست.`);
  }
  return new Types.ObjectId(stringValue);
}

export function formDataObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function validationState(error: ZodError): ContentActionState {
  const flattened = error.flatten();
  return {
    status: "error",
    message: "اطلاعات واردشده را بررسی کنید.",
    errors: flattened.fieldErrors,
  };
}

export function actionFailure(error: unknown): ContentActionState {
  if (error instanceof PublicActionError) {
    return { status: "error", message: error.message };
  }

  if (isDuplicateKeyError(error)) {
    return {
      status: "error",
      message: "این عملیات پیش‌تر انجام شده یا محتوایی با همین مشخصات وجود دارد.",
    };
  }

  console.error("Content mutation failed", error);
  return {
    status: "error",
    message: "عملیات انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
  };
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11_000
  );
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

export function contentHash(snapshot: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(snapshot)))
    .digest("hex");
}

export function makeContentSlug(value: string, kind: "prompt" | "skill") {
  const ascii = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  const suffix = randomUUID().slice(0, 8);
  const base = (ascii || kind).slice(0, kind === "prompt" ? 150 : 130).replace(/-+$/g, "");
  return `${base}-${suffix}`;
}

export function workflowSteps(steps: string[]) {
  return steps.map((instruction, index) => ({
    order: index + 1,
    title: `گام ${(index + 1).toLocaleString("fa-IR")}`,
    instruction,
  }));
}

export function skillDependencies(dependencies: string[]) {
  return dependencies.map((dependency) => {
    const separator = dependency.lastIndexOf("@");
    const hasVersion = separator > 0 && separator < dependency.length - 1;
    return {
      name: hasVersion ? dependency.slice(0, separator).trim() : dependency,
      versionRange: hasVersion ? dependency.slice(separator + 1).trim().slice(0, 32) : "*",
      optional: false,
    };
  });
}

export function changedSnapshotPaths(
  base: Record<string, unknown>,
  proposed: Record<string, unknown>,
) {
  return Object.keys(proposed).filter(
    (key) => JSON.stringify(stableValue(base[key])) !== JSON.stringify(stableValue(proposed[key])),
  );
}

export function rankForScore(score: number) {
  let rank: (typeof REPUTATION_RANKS)[number]["key"] = "beginner";
  for (const candidate of REPUTATION_RANKS) {
    if (score >= candidate.minimum) rank = candidate.key;
  }
  return rank;
}
