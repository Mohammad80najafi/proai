import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { timestampOptions, usernamePattern } from "@/models/_shared";

export const userRoles = ["user", "moderator", "admin"] as const;
export const userRanks = [
  "beginner",
  "explorer",
  "builder",
  "engineer",
  "architect",
  "ai-master",
] as const;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: usernamePattern,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      select: false,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    avatar: { type: String, trim: true, maxlength: 2_048, default: null },
    bio: { type: String, trim: true, maxlength: 320, default: "" },
    roles: {
      type: [{ type: String, enum: userRoles }],
      default: ["user"],
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
      index: true,
    },
    locale: { type: String, enum: ["fa-IR"], default: "fa-IR" },
    messagingPolicy: {
      type: String,
      enum: ["everyone", "following", "mutual", "nobody"],
      default: "mutual",
    },
    reputationScore: { type: Number, min: 0, default: 0, index: true },
    rank: { type: String, enum: userRanks, default: "beginner" },
    stats: {
      followers: { type: Number, min: 0, default: 0 },
      following: { type: Number, min: 0, default: 0 },
      prompts: { type: Number, min: 0, default: 0 },
      skills: { type: Number, min: 0, default: 0 },
      acceptedImprovements: { type: Number, min: 0, default: 0 },
    },
    lastSeenAt: { type: Date, default: null },
  },
  timestampOptions,
);

UserSchema.index(
  { username: "text", displayName: "text", bio: "text" },
  {
    name: "user_profile_search",
    default_language: "none",
    weights: { username: 8, displayName: 5, bio: 1 },
  },
);
UserSchema.index({ reputationScore: -1, createdAt: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", UserSchema);

