import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { objectId, slugPattern, timestampOptions } from "@/models/_shared";

const NewsCommentSchema = new Schema(
  {
    storySlug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
      match: slugPattern,
      index: true,
    },
    userId: objectId("User"),
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 2_000 },
    status: {
      type: String,
      enum: ["visible", "under-review", "removed"],
      default: "visible",
      index: true,
    },
  },
  timestampOptions,
);

NewsCommentSchema.index({ storySlug: 1, status: 1, createdAt: -1 });
NewsCommentSchema.index({ userId: 1, createdAt: -1 });

export type NewsCommentDocument = InferSchemaType<typeof NewsCommentSchema>;

export const NewsComment =
  (models.NewsComment as Model<NewsCommentDocument> | undefined) ??
  model<NewsCommentDocument>("NewsComment", NewsCommentSchema);
