import { BookmarkCheck, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PromptCard } from "@/components/ui/prompt-card";
import { SkillCard } from "@/components/ui/skill-card";
import { openExploreUpdateAction } from "@/features/content/actions";
import type { SavedContentDTO } from "@/features/shared/types";
import { formatDate } from "@/lib/format";

export function SavedContentCard({ item }: { item: SavedContentDTO }) {
  const targetType = item.kind === "prompt" ? "Prompt" : "Skill";
  const openAction = openExploreUpdateAction.bind(null, targetType, item.id);

  return (
    <article className="flex min-w-0 flex-col">
      <div className={`flex min-h-12 items-center justify-between gap-3 rounded-t-2xl border border-b-0 px-4 py-2.5 ${item.hasUnreadUpdate ? "border-cyan-300/20 bg-cyan-300/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}>
        <span className="inline-flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
          <BookmarkCheck className="size-3.5 shrink-0 text-indigo-300" aria-hidden="true" />
          <span className="truncate">ذخیره‌شده در {formatDate(item.savedAt)}</span>
        </span>
        {item.hasUnreadUpdate ? (
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="green">
              نسخه {item.savedVersion.toLocaleString("fa-IR")} ← {item.version.toLocaleString("fa-IR")}
            </Badge>
            <form action={openAction}>
              <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                دیدن نسخه تازه
              </button>
            </form>
          </div>
        ) : (
          <span className="shrink-0 text-[10px] text-slate-600">نسخه {item.version.toLocaleString("fa-IR")}</span>
        )}
      </div>

      {item.kind === "prompt" ? (
        <PromptCard
          id={item.slug}
          href={`/prompts/${item.slug}`}
          title={item.title}
          description={item.description}
          images={item.images}
          author={item.author}
          category={item.category}
          tags={item.tags}
          version={item.version}
          className="rounded-t-none"
          stats={{
            likes: item.stats.likes,
            saves: item.stats.saves,
            forks: item.stats.forks,
            rating: item.stats.ratingAverage,
          }}
        />
      ) : (
        <SkillCard
          id={item.slug}
          href={`/skills/${item.slug}`}
          name={item.title}
          description={item.description}
          images={item.images}
          creator={item.author}
          modules={item.tags}
          forks={item.stats.forks}
          rating={item.stats.ratingAverage}
          version={item.version}
          className="rounded-t-none"
        />
      )}
    </article>
  );
}
