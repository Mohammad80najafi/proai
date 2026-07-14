"use client";

import { useActionState } from "react";
import { LoaderCircle, UserCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { toggleFollowAction } from "@/features/social/actions";

const initialState: ContentActionState = { status: "idle" };

export function FollowButton({ userId, initialFollowing, fullWidth = false }: { userId: string; initialFollowing: boolean; fullWidth?: boolean }) {
  const [state, action, pending] = useActionState(toggleFollowAction, initialState);
  const following = state.data?.active ?? initialFollowing;
  return <form action={action} className={fullWidth ? "w-full" : undefined}><input type="hidden" name="userId" value={userId} /><Button type="submit" variant={following ? "secondary" : "primary"} disabled={pending} fullWidth={fullWidth}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}{following ? "دنبال می‌کنید" : "دنبال‌کردن"}</Button></form>;
}
