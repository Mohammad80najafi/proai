import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

const ReportSchema = new Schema(
  {
    reporterId: objectId("User"),
    targetModel: {
      type: String,
      enum: [
        "User",
        "Prompt",
        "Skill",
        "Comment",
        "Message",
        "ImprovementDiscussionMessage",
      ],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate", "sexual", "violence", "copyright", "misinformation", "other"],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 4_000, default: "" },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    assignedToId: optionalObjectId("User"),
    resolution: { type: String, trim: true, maxlength: 2_000, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  timestampOptions,
);
ReportSchema.index({ status: 1, createdAt: 1 });
ReportSchema.index({ targetModel: 1, targetId: 1, status: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

const BlockSchema = new Schema(
  {
    blockerId: objectId("User"),
    blockedId: objectId("User"),
    reason: { type: String, trim: true, maxlength: 400, default: "" },
  },
  timestampOptions,
);
BlockSchema.index(
  { blockerId: 1, blockedId: 1 },
  { unique: true, name: "unique_user_block" },
);
BlockSchema.index({ blockedId: 1, createdAt: -1 });

const ModerationActionSchema = new Schema(
  {
    moderatorId: objectId("User"),
    targetModel: {
      type: String,
      enum: ["User", "Prompt", "Skill", "Comment", "Report", "NewsArticle"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
    },
    action: {
      type: String,
      enum: [
        "user-status-updated",
        "user-role-updated",
        "content-status-updated",
        "report-resolved",
        "report-dismissed",
        "news-created",
        "news-updated",
        "news-deleted",
      ],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 2_000, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  timestampOptions,
);
ModerationActionSchema.index({ moderatorId: 1, createdAt: -1 });
ModerationActionSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });

export type ReportDocument = InferSchemaType<typeof ReportSchema>;
export type BlockDocument = InferSchemaType<typeof BlockSchema>;
export type ModerationActionDocument = InferSchemaType<typeof ModerationActionSchema>;

export const Report =
  (models.Report as Model<ReportDocument> | undefined) ??
  model<ReportDocument>("Report", ReportSchema);
export const Block =
  (models.Block as Model<BlockDocument> | undefined) ??
  model<BlockDocument>("Block", BlockSchema);
export const ModerationAction =
  (models.ModerationAction as Model<ModerationActionDocument> | undefined) ??
  model<ModerationActionDocument>("ModerationAction", ModerationActionSchema);
