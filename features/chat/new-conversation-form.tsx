"use client";

import { useActionState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { createConversationAction } from "@/features/chat/actions";

const initialState: ContentActionState = { status: "idle" };

export function NewConversationForm({
  targetUserId,
  compact = false,
}: {
  targetUserId: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(createConversationAction, initialState);
  return (
    <form action={action} className={compact ? "shrink-0" : undefined}>
      <input type="hidden" name="targetUserId" value={targetUserId} />
      {state.status === "error" ? (
        <p className="mb-3 max-w-sm text-sm leading-7 text-danger">{state.message}</p>
      ) : null}
      <Button
        type="submit"
        size={compact ? "sm" : "lg"}
        fullWidth={!compact}
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-4" aria-hidden="true" />
        )}
        {pending ? "در حال ساخت…" : "گفت‌وگو"}
      </Button>
    </form>
  );
}
