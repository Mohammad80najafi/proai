import Link from "next/link";
import { Bookmark, GitFork, Heart, Sparkles, Star } from "lucide-react";

import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "./cn";

export interface PromptCardProps {
  id: string;
  title: string;
  description: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string | null;
  };
  category: string;
  tags?: string[];
  version?: number;
  updatedAt?: string;
  featured?: boolean;
  stats?: {
    likes?: number;
    saves?: number;
    forks?: number;
    rating?: number;
  };
  href?: string;
  className?: string;
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <span className="text-slate-600 [&>svg]:size-3.5" aria-hidden>
        {icon}
      </span>
      <span className="tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PromptCard({
  id,
  title,
  description,
  author,
  category,
  tags = [],
  version = 1,
  updatedAt,
  featured = false,
  stats = {},
  href,
  className,
}: PromptCardProps) {
  const promptHref = href ?? `/prompts/${id}`;

  return (
    <Card
      interactive
      className={cn("group flex h-full min-w-0 flex-col overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <Link
          href={`/users/${author.username}`}
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          <Avatar
            src={author.avatar}
            alt={author.displayName}
            fallback={author.displayName}
            size="sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-slate-300">
              {author.displayName}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-slate-600" dir="ltr">
              @{author.username}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {featured ? (
            <Badge variant="indigo" title="منتخب سردبیر">
              <Sparkles className="size-3" aria-hidden />
              منتخب
            </Badge>
          ) : null}
          <Badge>{category}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <Link
          href={promptHref}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          <h3
            className="line-clamp-2 text-base font-semibold leading-7 text-slate-100 transition-colors group-hover:text-indigo-200 motion-reduce:transition-none"
            dir="auto"
          >
            {title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500" dir="auto">
          {description}
        </p>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="برچسب‌ها">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-slate-500"
                dir="auto"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 ? (
              <span className="rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-slate-600">
                +{(tags.length - 3).toLocaleString("fa-IR")}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.055] px-5 py-3.5 text-[11px] text-slate-500">
        <div className="flex items-center gap-3.5">
          <Stat
            icon={<Heart />}
            value={(stats.likes ?? 0).toLocaleString("fa-IR")}
            label="پسندها"
          />
          <Stat
            icon={<Bookmark />}
            value={(stats.saves ?? 0).toLocaleString("fa-IR")}
            label="ذخیره‌ها"
          />
          <Stat
            icon={<GitFork />}
            value={(stats.forks ?? 0).toLocaleString("fa-IR")}
            label="فورک‌ها"
          />
          {typeof stats.rating === "number" ? (
            <Stat
              icon={<Star />}
              value={stats.rating.toLocaleString("fa-IR", {
                maximumFractionDigits: 1,
              })}
              label="امتیاز"
            />
          ) : null}
        </div>
        <span className="shrink-0 text-slate-600">
          نسخه {version.toLocaleString("fa-IR")}
          {updatedAt ? <span className="hidden sm:inline"> · {updatedAt}</span> : null}
        </span>
      </div>
    </Card>
  );
}
