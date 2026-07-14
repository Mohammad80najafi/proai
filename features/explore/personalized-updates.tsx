import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  BookmarkCheck,
  Braces,
  Shapes,
  UserCheck,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { openExploreUpdateAction } from "@/features/content/actions";
import type { ExploreUpdateDTO } from "@/features/shared/types";
import { formatRelativeDate } from "@/lib/format";

function reasonLabel(item: ExploreUpdateDTO) {
  if (item.reason === "following-and-saved-update") return "دنبال می‌کنید · ذخیره‌شده";
  if (item.reason === "saved-update") return "ذخیره‌شده شما";
  return "از سازنده‌ای که دنبال می‌کنید";
}

export function PersonalizedUpdates({ items }: { items: ExploreUpdateDTO[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="personalized-updates-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <BellRing className="size-4" aria-hidden="true" />
            <p className="text-[11px] font-semibold">برای شما</p>
          </div>
          <h1 id="personalized-updates-title" className="mt-2 text-2xl font-black">
            تازه‌های دنبال‌شده‌ها و ذخیره‌های شما
          </h1>
          <p className="mt-2 text-sm text-muted">
            نسخه‌های تازه را ببینید؛ با بازکردن هر مورد، نشان به‌روزرسانی آن خوانده می‌شود.
          </p>
        </div>
        <Badge variant="indigo">
          {items.filter((item) => item.unread).length.toLocaleString("fa-IR")} به‌روزرسانی خوانده‌نشده
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const Icon = item.kind === "prompt" ? Braces : Shapes;
          const targetType = item.kind === "prompt" ? "Prompt" : "Skill";
          const openAction = openExploreUpdateAction.bind(null, targetType, item.id);

          return (
            <Card
              key={`${item.kind}:${item.id}`}
              className={`relative overflow-hidden p-5 ${item.unread ? "border-cyan-300/20 bg-cyan-300/[0.035]" : ""}`}
            >
              {item.unread ? (
                <span className="absolute inset-y-0 end-0 w-1 bg-cyan-300" aria-hidden="true" />
              ) : null}
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-cyan-200">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.unread ? <Badge variant="green">نسخه تازه</Badge> : null}
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-faint">
                      {item.reason === "following" ? (
                        <UserCheck className="size-3" aria-hidden="true" />
                      ) : (
                        <BookmarkCheck className="size-3" aria-hidden="true" />
                      )}
                      {reasonLabel(item)}
                    </span>
                  </div>
                  <h2 className="mt-3 line-clamp-1 font-bold text-slate-100" dir="auto">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted" dir="auto">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] pt-4">
                    <Link
                      href={`/users/${item.author.username}`}
                      className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                    >
                      <Avatar
                        src={item.author.avatar}
                        alt={item.author.displayName}
                        fallback={item.author.displayName}
                        size="xs"
                      />
                      <span className="truncate text-[11px] text-slate-400">
                        {item.author.displayName}
                      </span>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-faint">
                        {item.unread && item.previousVersion
                          ? `نسخه ${item.previousVersion.toLocaleString("fa-IR")} ← ${item.version.toLocaleString("fa-IR")}`
                          : `نسخه ${item.version.toLocaleString("fa-IR")} · ${formatRelativeDate(item.updatedAt)}`}
                      </span>
                      <form action={openAction}>
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-xl bg-cyan-300 px-3.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d121e]"
                        >
                          {item.unread ? "دیدن نسخه تازه" : "مشاهده"}
                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
