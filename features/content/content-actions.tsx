"use client";

import { useActionState } from "react";
import { Bookmark, GitFork, Heart, LoaderCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { forkPromptAction, forkSkillAction, rateContentAction, toggleLikeAction, toggleSaveAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

export function ContentActions({
  targetType,
  targetId,
  liked,
  saved,
  rating,
  likes,
  saves,
  forks,
}: {
  targetType: "Prompt" | "Skill";
  targetId: string;
  liked: boolean;
  saved: boolean;
  rating: number | null;
  likes: number;
  saves: number;
  forks: number;
}) {
  const [likeState, likeAction, likePending] = useActionState(toggleLikeAction, initialState);
  const [saveState, saveAction, savePending] = useActionState(toggleSaveAction, initialState);
  const [ratingState, ratingAction, ratingPending] = useActionState(rateContentAction, initialState);
  const forkAction = targetType === "Prompt" ? forkPromptAction : forkSkillAction;
  const [, forkFormAction, forkPending] = useActionState(forkAction, initialState);
  const isLiked = likeState.data?.active ?? liked;
  const isSaved = saveState.data?.active ?? saved;
  const likeCount = likeState.data?.count ?? likes;
  const saveCount = saveState.data?.count ?? saves;
  const selectedRating = ratingState.data?.rating ?? rating;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <form action={likeAction}>
          <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
          <Button type="submit" variant={isLiked ? "secondary" : "outline"} fullWidth disabled={likePending} className={isLiked ? "text-danger" : ""}>
            {likePending ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className={`size-4 ${isLiked ? "fill-current" : ""}`} />}
            {likeCount.toLocaleString("fa-IR")}
          </Button>
        </form>
        <form action={saveAction}>
          <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
          <Button type="submit" variant={isSaved ? "secondary" : "outline"} fullWidth disabled={savePending} className={isSaved ? "text-primary-strong" : ""}>
            {savePending ? <LoaderCircle className="size-4 animate-spin" /> : <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} />}
            {saveCount.toLocaleString("fa-IR")}
          </Button>
        </form>
        <form action={forkFormAction}>
          <input type="hidden" name="targetId" value={targetId} />
          <Button type="submit" variant="outline" fullWidth disabled={forkPending}>
            {forkPending ? <LoaderCircle className="size-4 animate-spin" /> : <GitFork className="size-4" />}
            {forks.toLocaleString("fa-IR")}
          </Button>
        </form>
      </div>

      <form action={ratingAction} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">امتیاز شما</span>
          <div className="flex flex-row-reverse items-center gap-1" aria-label="امتیاز از یک تا پنج">
            {[5, 4, 3, 2, 1].map((value) => (
              <button key={value} type="submit" name="value" value={value} disabled={ratingPending} className="rounded-md p-1 text-faint transition hover:text-warning focus-visible:text-warning" aria-label={`${value.toLocaleString("fa-IR")} ستاره`}>
                <Star className={`size-4 ${selectedRating && value <= selectedRating ? "fill-warning text-warning" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </form>

      {[likeState, saveState, ratingState].find((item) => item.status === "error")?.message ? (
        <p className="text-xs leading-5 text-danger">{[likeState, saveState, ratingState].find((item) => item.status === "error")?.message}</p>
      ) : null}
    </div>
  );
}
