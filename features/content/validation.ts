import { z } from "zod";

const visibilitySchema = z.enum(["draft", "public", "unlisted"]);
const licenseSchema = z.enum([
  "unspecified",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "mit",
  "proprietary",
]);

function splitList(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseImages(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

const contentImageSchema = z.object({
  url: z.string().regex(/^\/uploads\/content\/[a-f\d-]+\.(?:png|jpe?g|webp)$/i, "نشانی تصویر معتبر نیست."),
  alt: z.string().trim().max(200).default(""),
});

const contentImagesSchema = z
  .preprocess(parseImages, z.array(contentImageSchema).max(8, "حداکثر ۸ تصویر مجاز است."))
  .optional();

export const createPromptSchema = z.object({
  images: contentImagesSchema,
  title: z.string().trim().min(3, "عنوان باید حداقل ۳ نویسه باشد.").max(140),
  description: z.string().trim().min(10, "توضیح کوتاه‌تر از حد مجاز است.").max(1_000),
  content: z.string().trim().min(10, "متن پرامپت باید حداقل ۱۰ نویسه باشد.").max(100_000),
  category: z.enum([
    "development",
    "writing",
    "design",
    "business",
    "education",
    "research",
    "productivity",
    "other",
  ]),
  tags: z.preprocess(splitList, z.array(z.string().min(1).max(32)).max(12)),
  visibility: visibilitySchema.default("public"),
});

export const createSkillSchema = z.object({
  images: contentImagesSchema,
  name: z.string().trim().min(3, "نام مهارت باید حداقل ۳ نویسه باشد.").max(120),
  description: z.string().trim().min(10, "توضیح کوتاه‌تر از حد مجاز است.").max(1_000),
  instructions: z.string().trim().min(20, "دستورالعمل باید حداقل ۲۰ نویسه باشد.").max(100_000),
  requiredKnowledge: z.preprocess(splitList, z.array(z.string().min(1).max(120)).max(30)),
  workflow: z.preprocess(splitList, z.array(z.string().min(3).max(4_000)).max(30)),
  tools: z.preprocess(splitList, z.array(z.string().min(1).max(120)).max(30)),
  dependencies: z.preprocess(splitList, z.array(z.string().min(1).max(120)).max(20)),
  tags: z.preprocess(splitList, z.array(z.string().min(1).max(32)).max(12)),
  visibility: visibilitySchema.default("public"),
  license: licenseSchema.default("cc-by-4.0"),
});

export const commentSchema = z.object({
  targetType: z.enum(["Prompt", "Skill"]),
  targetId: z.string().trim().min(1),
  parentId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().regex(/^[a-f\d]{24}$/i, "شناسه دیدگاه معتبر نیست.").optional(),
  ),
  content: z.string().trim().min(2, "دیدگاه خیلی کوتاه است.").max(8_000),
});

export const interactionSchema = z.object({
  targetType: z.enum(["Prompt", "Skill"]),
  targetId: z.string().trim().min(1),
});

export const ratingSchema = interactionSchema.extend({
  value: z.coerce.number().int().min(1).max(5),
});

export const improvementRequestSchema = z.object({
  targetType: z.enum(["Prompt", "Skill"]),
  targetId: z.string().trim().min(1),
  baseVersionId: z.string().trim().min(1),
  requestTitle: z.string().trim().min(3, "عنوان درخواست خیلی کوتاه است.").max(160),
  summary: z.string().trim().min(10, "خلاصهٔ تغییرات باید روشن‌تر باشد.").max(4_000),
});

export const improvementMessageSchema = z.object({
  requestId: z.string().trim().min(1),
  content: z.string().trim().min(1, "پیام نمی‌تواند خالی باشد.").max(8_000),
});

export const improvementDecisionSchema = z.object({
  requestId: z.string().trim().min(1),
  decision: z.enum(["accept", "reject", "request-changes", "close"]),
  reason: z.string().trim().max(2_000).default(""),
  versionBump: z.enum(["patch", "minor", "major", "custom"]).default("minor"),
  customVersionLabel: z.string().trim().max(32).default(""),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
