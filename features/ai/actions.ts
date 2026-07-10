"use server";

import { z } from "zod";

import { analyzePrompt } from "@/features/ai/service";
import type { AIResult } from "@/features/ai/schema";
import { getOptionalUser } from "@/lib/auth/dal";
import { consumeRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  prompt: z.string().trim().min(10, "پرامپت باید حداقل ۱۰ نویسه باشد.").max(20_000, "پرامپت بیش از حد طولانی است."),
});

export type AnalyzerActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: AIResult;
};

export async function analyzePromptAction(
  _previousState: AnalyzerActionState,
  formData: FormData,
): Promise<AnalyzerActionState> {
  const parsed = requestSchema.safeParse({ prompt: formData.get("prompt") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "پرامپت معتبر نیست." };
  }

  try {
    const user = await getOptionalUser();
    if (!user) {
      return {
        status: "error",
        message: "برای استفاده از تحلیل‌گر هوشمند ابتدا وارد حساب خود شوید.",
      };
    }

    const [burstLimit, dailyLimit] = await Promise.all([
      consumeRateLimit({
        scope: "ai:analyze:burst",
        subject: user.id,
        limit: 12,
        windowMs: 10 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: "ai:analyze:daily",
        subject: user.id,
        limit: 50,
        windowMs: 24 * 60 * 60 * 1_000,
      }),
    ]);

    if (!burstLimit.allowed || !dailyLimit.allowed) {
      return {
        status: "error",
        message: "سهمیه تحلیل شما در این بازه مصرف شده است. کمی بعد دوباره تلاش کنید.",
      };
    }

    const result = await analyzePrompt(parsed.data.prompt);
    return { status: "success", result };
  } catch {
    return { status: "error", message: "تحلیل کامل نشد. چند لحظه بعد دوباره تلاش کنید." };
  }
}
