"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/features/shared/action-state";
import { getNewsStory } from "@/features/news/data";
import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { NewsComment } from "@/models/NewsComment";

export type NewsCommentActionState = ActionState<"content">;

const newsCommentSchema = z.object({
  storySlug: z.string().trim().min(1).max(180),
  content: z.string().trim().min(2, "دیدگاه باید دست‌کم ۲ نویسه باشد.").max(2_000, "دیدگاه بیش از حد طولانی است."),
});

export async function addNewsCommentAction(
  _previousState: NewsCommentActionState,
  formData: FormData,
): Promise<NewsCommentActionState> {
  const user = await requireUser();
  const parsed = newsCommentSchema.safeParse({
    storySlug: formData.get("storySlug"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "متن دیدگاه را بررسی کنید.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!getNewsStory(parsed.data.storySlug)) {
    return { status: "error", message: "این خبر پیدا نشد." };
  }

  try {
    await connectToDatabase();
    await NewsComment.create({
      storySlug: parsed.data.storySlug,
      userId: user.id,
      content: parsed.data.content,
    });
  } catch (error) {
    console.error("News comment creation failed", error);
    return { status: "error", message: "دیدگاه ثبت نشد. چند لحظه دیگر دوباره تلاش کنید." };
  }

  revalidatePath(`/news/${parsed.data.storySlug}`);
  return { status: "success", message: "دیدگاه شما منتشر شد." };
}
