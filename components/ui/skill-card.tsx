import Image from "next/image";
import Link from "next/link";
import { Boxes, GitPullRequestArrow, Images, Network, Star, Wrench } from "lucide-react";

import type { ContentImage } from "@/features/shared/types";

import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "./cn";

export interface SkillCardProps {
  id: string;
  name: string;
  description: string;
  images?: ContentImage[];
  creator: {
    username: string;
    displayName: string;
    avatar?: string | null;
  };
  modules?: string[];
  toolsCount?: number;
  dependenciesCount?: number;
  forks?: number;
  rating?: number;
  version?: number;
  href?: string;
  className?: string;
}

export function SkillCard({
  id,
  name,
  description,
  images = [],
  creator,
  modules = [],
  toolsCount = 0,
  dependenciesCount = 0,
  forks = 0,
  rating,
  version = 1,
  href,
  className,
}: SkillCardProps) {
  const skillHref = href ?? `/skills/${id}`;

  return (
    <Card
      interactive
      className={cn("group flex h-full min-w-0 flex-col overflow-hidden", className)}
    >
      <Link
        href={skillHref}
        className="relative block aspect-[16/9] overflow-hidden border-b border-white/[0.055] bg-[#0c0c18] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70"
        aria-label={name}
      >
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={images[0].alt || name}
            fill
            sizes="(min-width: 1536px) 30vw, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.16),transparent_38%),linear-gradient(145deg,#111023,#090910)]">
            <span className="absolute -right-5 top-2 font-mono text-[78px] font-black text-white/[0.025]">01</span>
            <span className="grid size-14 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200 shadow-[0_16px_45px_rgba(88,28,135,0.2)]">
              <Boxes className="size-6" aria-hidden />
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

      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-[13px] border border-violet-400/15 bg-violet-400/[0.09] text-violet-300">
          <Boxes className="size-[18px]" aria-hidden="true" />
        </div>
        <Badge variant="indigo">نسخه {version.toLocaleString("fa-IR")}</Badge>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <Link
          href={skillHref}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          <h3
            className="line-clamp-2 text-base font-semibold leading-7 text-slate-100 transition-colors group-hover:text-violet-200 motion-reduce:transition-none"
            dir="auto"
          >
            {name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500" dir="auto">
          {description}
        </p>

        {modules.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="دانش‌های این مهارت">
            {modules.slice(0, 3).map((module) => (
              <Badge key={module} className="max-w-full" variant="neutral">
                <span className="truncate" dir="auto">
                  {module}
                </span>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.055] pt-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5" title="ابزارها">
            <Wrench className="size-3.5 text-slate-600" aria-hidden="true" />
            {toolsCount.toLocaleString("fa-IR")} ابزار
          </span>
          <span className="flex items-center gap-1.5" title="وابستگی‌ها">
            <Network className="size-3.5 text-slate-600" aria-hidden="true" />
            {dependenciesCount.toLocaleString("fa-IR")} وابستگی
          </span>
          <span className="flex items-center gap-1.5" title="بهبودهای پذیرفته‌شده">
            <GitPullRequestArrow className="size-3.5 text-slate-600" aria-hidden="true" />
            {forks.toLocaleString("fa-IR")} بهبود
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.055] px-5 py-3.5">
        <Link
          href={`/users/${creator.username}`}
          className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          <Avatar
            src={creator.avatar}
            alt={creator.displayName}
            fallback={creator.displayName}
            size="xs"
          />
          <span className="truncate text-[11px] text-slate-400">{creator.displayName}</span>
        </Link>
        {typeof rating === "number" ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Star className="size-3.5 fill-amber-300/70 text-amber-300" aria-hidden="true" />
            {rating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
