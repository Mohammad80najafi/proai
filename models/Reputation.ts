import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

export const reputationReasons = [
  "prompt-published",
  "skill-published",
  "improvement-accepted",
  "helpful-comment",
  "content-liked",
  "achievement",
  "moderation-adjustment",
] as const;

const ReputationEventSchema = new Schema(
  {
    userId: objectId("User"),
    actorId: optionalObjectId("User"),
    reason: { type: String, enum: reputationReasons, required: true },
    points: { type: Number, required: true, min: -100_000, max: 100_000 },
    balanceAfter: { type: Number, min: 0, default: null },
    targetModel: {
      type: String,
      enum: ["Prompt", "Skill", "Comment", "ImprovementRequest", "Achievement"],
      default: null,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      refPath: "targetModel",
      default: null,
    },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    dedupeKey: { type: String, required: true, trim: true, maxlength: 240, unique: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  timestampOptions,
);

ReputationEventSchema.index({ userId: 1, createdAt: -1 });
ReputationEventSchema.index({ reason: 1, createdAt: -1 });

const AchievementSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    icon: { type: String, required: true, trim: true, maxlength: 80 },
    points: { type: Number, min: 0, default: 0 },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze" },
    criteria: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  timestampOptions,
);

const UserAchievementSchema = new Schema(
  {
    userId: objectId("User"),
    achievementId: objectId("Achievement"),
    awardedAt: { type: Date, required: true, default: Date.now },
    progress: { type: Number, min: 0, max: 100, default: 100 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  timestampOptions,
);
UserAchievementSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true, name: "unique_user_achievement" },
);
UserAchievementSchema.index({ userId: 1, awardedAt: -1 });

export type ReputationEventDocument = InferSchemaType<typeof ReputationEventSchema>;
export type AchievementDocument = InferSchemaType<typeof AchievementSchema>;
export type UserAchievementDocument = InferSchemaType<typeof UserAchievementSchema>;

export const ReputationEvent =
  (models.ReputationEvent as Model<ReputationEventDocument> | undefined) ??
  model<ReputationEventDocument>("ReputationEvent", ReputationEventSchema);
export const Achievement =
  (models.Achievement as Model<AchievementDocument> | undefined) ??
  model<AchievementDocument>("Achievement", AchievementSchema);
export const UserAchievement =
  (models.UserAchievement as Model<UserAchievementDocument> | undefined) ??
  model<UserAchievementDocument>("UserAchievement", UserAchievementSchema);

