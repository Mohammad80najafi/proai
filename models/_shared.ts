import { Schema, Types } from "mongoose";

export const objectId = (ref?: string) => ({
  type: Schema.Types.ObjectId,
  ...(ref ? { ref } : {}),
  required: true,
});

export const optionalObjectId = (ref?: string) => ({
  type: Schema.Types.ObjectId,
  ...(ref ? { ref } : {}),
  default: null,
});

export const timestampOptions = {
  timestamps: true,
  versionKey: false,
} as const;

export const targetTypes = ["Prompt", "Skill"] as const;
export const socialTargetTypes = [
  "Prompt",
  "Skill",
  "Comment",
  "ImprovementDiscussionMessage",
] as const;

export type TargetType = (typeof targetTypes)[number];
export type SocialTargetType = (typeof socialTargetTypes)[number];

export type ObjectId = Types.ObjectId;

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const usernamePattern = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

