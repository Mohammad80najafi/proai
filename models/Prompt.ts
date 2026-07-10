import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import {
  objectId,
  optionalObjectId,
  slugPattern,
  timestampOptions,
} from "@/models/_shared";

export const contentVisibilities = ["draft", "public", "unlisted"] as const;
export const promptCategories = [
  "development",
  "writing",
  "design",
  "business",
  "education",
  "research",
  "productivity",
  "other",
] as const;

const PromptSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      match: slugPattern,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1_000,
    },
    content: { type: String, required: true, minlength: 10, maxlength: 100_000 },
    category: {
      type: String,
      enum: promptCategories,
      required: true,
      index: true,
    },
    creatorId: objectId("User"),
    currentVersionId: optionalObjectId("PromptVersion"),
    currentVersion: { type: Number, min: 1, default: 1 },
    visibility: {
      type: String,
      enum: contentVisibilities,
      default: "draft",
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ["visible", "under-review", "removed"],
      default: "visible",
      index: true,
    },
    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxlength: 32 }],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 12,
        message: "A prompt can have at most 12 tags",
      },
    },
    license: {
      type: String,
      enum: ["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"],
      default: "unspecified",
    },
    forkedFrom: {
      promptId: optionalObjectId("Prompt"),
      versionId: optionalObjectId("PromptVersion"),
      creatorId: optionalObjectId("User"),
    },
    stats: {
      likes: { type: Number, min: 0, default: 0 },
      saves: { type: Number, min: 0, default: 0 },
      forks: { type: Number, min: 0, default: 0 },
      comments: { type: Number, min: 0, default: 0 },
      ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
      ratingCount: { type: Number, min: 0, default: 0 },
      views: { type: Number, min: 0, default: 0 },
    },
    aiScore: { type: Number, min: 0, max: 100, default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  timestampOptions,
);

PromptSchema.index(
  { title: "text", description: "text", tags: "text" },
  {
    name: "prompt_search",
    default_language: "none",
    weights: { title: 8, tags: 4, description: 2 },
  },
);
PromptSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "unique_prompt_slug",
    partialFilterExpression: { slug: { $type: "string" } },
  },
);
PromptSchema.index({ visibility: 1, moderationStatus: 1, publishedAt: -1 });
PromptSchema.index({ creatorId: 1, createdAt: -1 });
PromptSchema.index({ category: 1, "stats.likes": -1, publishedAt: -1 });
PromptSchema.index({ tags: 1, visibility: 1 });

export type PromptDocument = InferSchemaType<typeof PromptSchema>;

export const Prompt =
  (models.Prompt as Model<PromptDocument> | undefined) ??
  model<PromptDocument>("Prompt", PromptSchema);
