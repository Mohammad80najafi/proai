"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { addNewsCommentAction, type NewsCommentActionState } from "@/features/news/actions";

const initialState: NewsCommentActionState = { status: "idle" };

export function NewsCommentForm({ storySlug }: { storySlug: string }) {
  const [state, action, pending] = useActionState(addNewsCommentAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="storySlug" value={storySlug} />
      <Textarea
        name="content"
        label="دیدگاه شما"
        placeholder="نظرتان درباره این خبر یا تجربه مرتبط خود را بنویسید…"
        rows={4}
        maxLength={2_000}
        error={state.errors?.content?.[0]}
        required
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`} aria-live="polite">
          {state.message}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="size-4" strokeWidth={1.5} aria-hidden="true" />}
          {pending ? "در حال انتشار…" : "انتشار دیدگاه"}
        </Button>
      </div>
    </form>
  );
}
