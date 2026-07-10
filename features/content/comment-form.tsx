"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { addCommentAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

export function CommentForm({ targetType, targetId }: { targetType: "Prompt" | "Skill"; targetId: string }) {
  const [state, action, pending] = useActionState(addCommentAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
      <Textarea name="content" label="دیدگاه شما" placeholder="نکته، تجربه یا پیشنهادتان را بنویسید… برای اشاره از @username استفاده کنید." rows={4} error={state.errors?.content?.[0]} required />
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "در حال ارسال…" : "ارسال دیدگاه"}
        </Button>
      </div>
    </form>
  );
}
