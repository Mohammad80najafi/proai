import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

const PromptVersionSchema = new Schema(
  {
    promptId: objectId("Prompt"),
    versionNumber: { type: Number, required: true, min: 1, immutable: true },
    versionLabel: { type: String, trim: true, maxlength: 32, default: "1.0.0" },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 1_000 },
    content: { type: String, required: true, minlength: 10, maxlength: 100_000 },
    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxlength: 32 }],
      default: [],
    },
    category: {
      type: String,
      enum: ["development", "writing", "design", "business", "education", "research", "productivity", "other"],
      default: "other",
    },
    license: {
      type: String,
      enum: ["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"],
      default: "unspecified",
    },
    changeSummary: { type: String, required: true, trim: true, maxlength: 2_000 },
    authorId: objectId("User"),
    parentVersionId: optionalObjectId("PromptVersion"),
    acceptedRequestId: optionalObjectId("ImprovementRequest"),
    source: {
      type: String,
      enum: ["initial", "owner", "accepted-improvement", "import"],
      required: true,
    },
    contentHash: { type: String, required: true, maxlength: 128 },
    isOfficial: { type: Boolean, default: true, immutable: true },
  },
  timestampOptions,
);

PromptVersionSchema.index(
  { promptId: 1, versionNumber: 1 },
  { unique: true, name: "unique_prompt_version" },
);
PromptVersionSchema.index({ promptId: 1, createdAt: -1 });
PromptVersionSchema.index({ authorId: 1, createdAt: -1 });

export type PromptVersionDocument = InferSchemaType<typeof PromptVersionSchema>;

export const PromptVersion =
  (models.PromptVersion as Model<PromptVersionDocument> | undefined) ??
  model<PromptVersionDocument>("PromptVersion", PromptVersionSchema);
