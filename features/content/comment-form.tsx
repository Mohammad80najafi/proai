"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { addCommentAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

type CommentFormProps = {
  targetType: "Prompt" | "Skill";
  targetId: string;
  parentId?: string;
  replyingTo?: string;
  onCancel?: () => void;
  onPublished?: () => void;
};

export function CommentForm({
  targetType,
  targetId,
  parentId,
  replyingTo,
  onCancel,
  onPublished,
}: CommentFormProps) {
  const [state, action, pending] = useActionState(addCommentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const handledSuccess = useRef(false);
  const isReply = Boolean(parentId);

  useEffect(() => {
    if (state.status !== "success" || handledSuccess.current) return;
    handledSuccess.current = true;
    formRef.current?.reset();
    onPublished?.();
  }, [onPublished, state.status]);

  return (
    <form
      ref={formRef}
      action={action}
      className={isReply ? "space-y-2.5" : "space-y-3"}
      onSubmit={() => {
        handledSuccess.current = false;
      }}
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <Textarea
        name="content"
        label={isReply ? `پاسخ به @${replyingTo ?? "کاربر"}` : "دیدگاه شما"}
        placeholder={
          isReply
            ? "پاسخ خود را بنویسید…"
            : "نکته، تجربه یا پیشنهادتان را بنویسید… برای اشاره از @username استفاده کنید."
        }
        rows={isReply ? 3 : 4}
        className={isReply ? "min-h-24" : undefined}
        error={state.errors?.content?.[0]}
        required
        autoFocus={isReply}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}
          aria-live="polite"
        >
          {state.message}
        </p>
        <div className="ms-auto flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="size-3.5" aria-hidden />
              انصراف
            </Button>
          ) : null}
          <Button
            type="submit"
            size={isReply ? "sm" : "md"}
            loading={pending}
            loadingLabel="در حال ارسال…"
          >
            <Send className="size-4" aria-hidden />
            {isReply ? "ارسال پاسخ" : "ارسال دیدگاه"}
          </Button>
        </div>
      </div>
    </form>
  );
}
