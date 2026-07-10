import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { timestampOptions } from "@/models/_shared";

const RateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    scope: { type: String, required: true, maxlength: 80 },
    subjectHash: { type: String, required: true, maxlength: 64 },
    windowStartedAt: { type: Date, required: true },
    count: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  timestampOptions,
);

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RateLimitSchema.index({ scope: 1, subjectHash: 1, windowStartedAt: -1 });

export type RateLimitDocument = InferSchemaType<typeof RateLimitSchema>;

export const RateLimit =
  (models.RateLimit as Model<RateLimitDocument> | undefined) ??
  model<RateLimitDocument>("RateLimit", RateLimitSchema);
