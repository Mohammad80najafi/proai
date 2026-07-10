import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, targetTypes, timestampOptions } from "@/models/_shared";

const CommentSchema = new Schema(
  {
    userId: objectId("User"),
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    parentId: optionalObjectId("Comment"),
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 8_000 },
    mentions: { type: [objectId("User")], default: [] },
    status: {
      type: String,
      enum: ["visible", "under-review", "removed", "deleted"],
      default: "visible",
      index: true,
    },
    editedAt: { type: Date, default: null },
    replyCount: { type: Number, min: 0, default: 0 },
    reactionCount: { type: Number, min: 0, default: 0 },
  },
  timestampOptions,
);

CommentSchema.index({ targetType: 1, targetId: 1, parentId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof CommentSchema>;

export const Comment =
  (models.Comment as Model<CommentDocument> | undefined) ??
  model<CommentDocument>("Comment", CommentSchema);

