import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, socialTargetTypes, targetTypes, timestampOptions } from "@/models/_shared";

const LikeSchema = new Schema(
  {
    userId: objectId("User"),
    targetType: { type: String, enum: socialTargetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
  },
  timestampOptions,
);
LikeSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true, name: "unique_like" },
);
LikeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const ReactionSchema = new Schema(
  {
    userId: objectId("User"),
    targetType: {
      type: String,
      enum: ["Comment", "ImprovementDiscussionMessage"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    kind: {
      type: String,
      enum: ["helpful", "insightful", "celebrate"],
      required: true,
    },
  },
  timestampOptions,
);
ReactionSchema.index(
  { userId: 1, targetType: 1, targetId: 1, kind: 1 },
  { unique: true, name: "unique_reaction" },
);
ReactionSchema.index({ targetType: 1, targetId: 1, kind: 1 });

const SaveSchema = new Schema(
  {
    userId: objectId("User"),
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    folder: { type: String, trim: true, maxlength: 80, default: "default" },
  },
  timestampOptions,
);
SaveSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    name: "unique_save",
    partialFilterExpression: {
      userId: { $type: "objectId" },
      targetType: { $type: "string" },
      targetId: { $type: "objectId" },
    },
  },
);
SaveSchema.index({ userId: 1, folder: 1, createdAt: -1 });

const RatingSchema = new Schema(
  {
    userId: objectId("User"),
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  timestampOptions,
);
RatingSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true, name: "unique_rating" },
);
RatingSchema.index({ targetType: 1, targetId: 1, value: 1 });

export type LikeDocument = InferSchemaType<typeof LikeSchema>;
export type ReactionDocument = InferSchemaType<typeof ReactionSchema>;
export type SaveDocument = InferSchemaType<typeof SaveSchema>;
export type RatingDocument = InferSchemaType<typeof RatingSchema>;

export const Like =
  (models.Like as Model<LikeDocument> | undefined) ??
  model<LikeDocument>("Like", LikeSchema);
export const Reaction =
  (models.Reaction as Model<ReactionDocument> | undefined) ??
  model<ReactionDocument>("Reaction", ReactionSchema);
export const Save =
  (models.Save as Model<SaveDocument> | undefined) ??
  model<SaveDocument>("Save", SaveSchema);
export const Rating =
  (models.Rating as Model<RatingDocument> | undefined) ??
  model<RatingDocument>("Rating", RatingSchema);
