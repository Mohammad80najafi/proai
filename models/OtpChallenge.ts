import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { timestampOptions } from "@/models/_shared";

const OtpChallengeSchema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: /^\+989\d{9}$/,
    },
    codeHash: { type: String, required: true, select: false },
    attemptsRemaining: { type: Number, required: true, min: 0, max: 5 },
    verifiedAt: { type: Date, default: null },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  timestampOptions,
);

OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpChallengeSchema.index({ phoneNumber: 1, createdAt: -1 });

export type OtpChallengeDocument = InferSchemaType<typeof OtpChallengeSchema>;

export const OtpChallenge =
  (models.OtpChallenge as Model<OtpChallengeDocument> | undefined) ??
  model<OtpChallengeDocument>("OtpChallenge", OtpChallengeSchema);
