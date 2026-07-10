import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, targetTypes, timestampOptions } from "@/models/_shared";

export const improvementStatuses = [
  "draft",
  "open",
  "changes-requested",
  "accepted",
  "rejected",
  "closed",
] as const;

const ImprovementRequestSchema = new Schema(
  {
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    ownerId: objectId("User"),
    proposerId: objectId("User"),
    forkId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    baseVersionModel: {
      type: String,
      enum: ["PromptVersion", "SkillVersion"],
      required: true,
    },
    baseVersionId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "baseVersionModel",
    },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    summary: { type: String, required: true, trim: true, minlength: 10, maxlength: 4_000 },
    proposedSnapshot: { type: Schema.Types.Mixed, required: true },
    changedPaths: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    status: {
      type: String,
      enum: improvementStatuses,
      default: "draft",
      index: true,
    },
    decisionReason: { type: String, trim: true, maxlength: 2_000, default: "" },
    acceptedVersionModel: {
      type: String,
      enum: ["PromptVersion", "SkillVersion"],
      default: null,
    },
    acceptedVersionId: {
      type: Schema.Types.ObjectId,
      refPath: "acceptedVersionModel",
      default: null,
    },
    hasBaseConflict: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, required: true, default: Date.now },
  },
  timestampOptions,
);

ImprovementRequestSchema.index({ ownerId: 1, status: 1, lastActivityAt: -1 });
ImprovementRequestSchema.index({ proposerId: 1, status: 1, lastActivityAt: -1 });
ImprovementRequestSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ImprovementRequestSchema.index({ forkId: 1, status: 1 });

export type ImprovementRequestDocument = InferSchemaType<typeof ImprovementRequestSchema>;

export const ImprovementRequest =
  (models.ImprovementRequest as Model<ImprovementRequestDocument> | undefined) ??
  model<ImprovementRequestDocument>("ImprovementRequest", ImprovementRequestSchema);

const ImprovementDiscussionMessageSchema = new Schema(
  {
    requestId: objectId("ImprovementRequest"),
    senderId: optionalObjectId("User"),
    kind: {
      type: String,
      enum: ["message", "system", "changes-requested", "decision"],
      default: "message",
    },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 8_000 },
    readBy: { type: [objectId("User")], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  timestampOptions,
);

ImprovementDiscussionMessageSchema.index({ requestId: 1, createdAt: 1 });
ImprovementDiscussionMessageSchema.index({ requestId: 1, "readBy": 1 });

export type ImprovementDiscussionMessageDocument = InferSchemaType<
  typeof ImprovementDiscussionMessageSchema
>;

export const ImprovementDiscussionMessage =
  (models.ImprovementDiscussionMessage as
    | Model<ImprovementDiscussionMessageDocument>
    | undefined) ??
  model<ImprovementDiscussionMessageDocument>(
    "ImprovementDiscussionMessage",
    ImprovementDiscussionMessageSchema,
  );

