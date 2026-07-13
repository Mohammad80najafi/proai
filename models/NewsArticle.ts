import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, slugPattern, timestampOptions } from "@/models/_shared";

const NewsSectionSchema = new Schema(
  {
    heading: { type: String, required: true, trim: true, maxlength: 180 },
    paragraphs: {
      type: [{ type: String, trim: true, maxlength: 8_000 }],
      default: [],
      validate: { validator: (items: string[]) => items.length <= 12 },
    },
  },
  { _id: false },
);

const NewsArticleSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
      match: slugPattern,
    },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 220 },
    summary: { type: String, required: true, trim: true, minlength: 10, maxlength: 1_200 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    source: { type: String, required: true, trim: true, maxlength: 100 },
    sourceUrl: { type: String, required: true, trim: true, maxlength: 2_048 },
    coverImage: { type: String, required: true, trim: true, maxlength: 2_048 },
    readTimeMinutes: { type: Number, required: true, min: 1, max: 120, default: 5 },
    sections: {
      type: [NewsSectionSchema],
      required: true,
      validate: { validator: (items: unknown[]) => items.length >= 1 && items.length <= 8 },
    },
    takeaways: {
      type: [{ type: String, trim: true, maxlength: 400 }],
      default: [],
      validate: { validator: (items: string[]) => items.length <= 8 },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    accentTheme: {
      type: String,
      enum: ["mint", "sky", "amber", "violet"],
      default: "mint",
    },
    authorId: objectId("User"),
    publishedAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  timestampOptions,
);

NewsArticleSchema.index({ status: 1, deletedAt: 1, featured: -1, publishedAt: -1 });
NewsArticleSchema.index(
  { title: "text", summary: "text", category: "text", source: "text" },
  { name: "news_article_search", default_language: "none" },
);

export type NewsArticleDocument = InferSchemaType<typeof NewsArticleSchema>;

export const NewsArticle =
  (models.NewsArticle as Model<NewsArticleDocument> | undefined) ??
  model<NewsArticleDocument>("NewsArticle", NewsArticleSchema);
