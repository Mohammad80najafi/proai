import Image from "next/image";
import Link from "next/link";
import { Bookmark, Braces, GitPullRequestArrow, Heart, Images, Sparkles, Star } from "lucide-react";

import type { ContentImage } from "@/features/shared/types";

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
  images?: ContentImage[];
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
  images = [],
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
      <Link
        href={promptHref}
        className="relative block aspect-[16/9] overflow-hidden border-b border-white/[0.055] bg-[#0a1020] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/70"
        aria-label={title}
      >
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={images[0].alt || title}
            fill
            sizes="(min-width: 1536px) 30vw, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(129,140,248,0.18),transparent_36%),linear-gradient(145deg,#0c1324,#080b13)]">
            <span className="absolute -left-4 top-5 font-mono text-[72px] font-black text-white/[0.025]">&#123;</span>
            <span className="grid size-14 place-items-center rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.07] text-indigo-200 shadow-[0_16px_45px_rgba(49,46,129,0.2)]">
              <Braces className="size-6" aria-hidden />
            </span>
          </div>
        )}
        {images.length > 1 ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] text-white backdrop-blur-md">
            <Images className="size-3" aria-hidden />
            {images.length.toLocaleString("fa-IR")}
          </span>
        ) : null}
      </Link>

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
            icon={<GitPullRequestArrow />}
            value={(stats.forks ?? 0).toLocaleString("fa-IR")}
            label="بهبودهای پذیرفته‌شده"
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
