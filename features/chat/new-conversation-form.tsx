"use client";

import { useActionState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { createConversationAction } from "@/features/chat/actions";

const initialState: ContentActionState = { status: "idle" };

export function NewConversationForm({ targetUserId }: { targetUserId: string }) {
  const [state, action, pending] = useActionState(createConversationAction, initialState);
  return <form action={action}><input type="hidden" name="targetUserId" value={targetUserId} />{state.status === "error" ? <p className="mb-3 text-sm leading-7 text-danger">{state.message}</p> : null}<Button type="submit" size="lg" fullWidth disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}{pending ? "در حال ساخت…" : "شروع گفت‌وگو"}</Button></form>;
}
