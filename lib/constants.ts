export const APP_NAME = "ProAI";
export const APP_NAME_FA = "هاب هوش مصنوعی";

export const PROMPT_CATEGORIES = [
  "برنامه‌نویسی",
  "تولید محتوا",
  "تحقیق و تحلیل",
  "طراحی محصول",
  "کسب‌وکار",
  "آموزش",
  "خلاقیت",
] as const;

export const REPUTATION_RANKS = [
  { key: "beginner", label: "تازه‌کار", minimum: 0 },
  { key: "explorer", label: "کاوشگر", minimum: 100 },
  { key: "builder", label: "سازنده", minimum: 350 },
  { key: "engineer", label: "مهندس", minimum: 800 },
  { key: "architect", label: "معمار", minimum: 1_800 },
  { key: "ai-master", label: "استاد هوش مصنوعی", minimum: 4_000 },
] as const;

export const REPUTATION_POINTS = {
  createPrompt: 20,
  createSkill: 30,
  acceptedImprovement: 35,
  receiveLike: 2,
  helpfulComment: 5,
  forkedContent: 8,
} as const;
