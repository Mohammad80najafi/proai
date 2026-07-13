import type { ReactNode } from "react";
import Link from "next/link";
import { Award, Users } from "lucide-react";

import { Avatar } from "./avatar";
import { ButtonLink } from "./button";
import { Card } from "./card";
import { cn } from "./cn";

export interface UserCardProps {
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string | null;
  contributionScore?: number;
  followers?: number;
  prompts?: number;
  skills?: number;
  action?: ReactNode;
  href?: string;
  className?: string;
}

export function UserCard({
  username,
  displayName,
  bio,
  avatar,
  contributionScore = 0,
  followers = 0,
  prompts = 0,
  skills = 0,
  action,
  href,
  className,
}: UserCardProps) {
  const profileHref = href ?? `/users/${username}`;

  return (
    <Card className={cn("flex h-full flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <Link
          href={profileHref}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d121e]"
        >
          <Avatar src={avatar} alt={displayName} fallback={displayName} size="lg" />
        </Link>
      </div>

      <div className="mt-4 min-w-0">
        <Link
          href={profileHref}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          <h3 className="truncate text-base font-semibold text-slate-100">{displayName}</h3>
        </Link>
        <p className="mt-1 truncate text-[11px] text-slate-600" dir="ltr">
          @{username}
        </p>
        {bio ? (
          <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500" dir="auto">
            {bio}
          </p>
        ) : (
          <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
            هنوز توضیحی برای این پروفایل نوشته نشده است.
          </p>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-white/[0.065] rounded-xl border border-white/[0.065] bg-white/[0.025] py-3 text-center">
        <div>
          <dt className="text-[10px] text-slate-600">دنبال‌کننده</dt>
          <dd className="mt-1 text-xs font-semibold text-slate-300">
            {followers.toLocaleString("fa-IR")}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-slate-600">پرامپت</dt>
          <dd className="mt-1 text-xs font-semibold text-slate-300">
            {prompts.toLocaleString("fa-IR")}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-slate-600">مهارت</dt>
          <dd className="mt-1 text-xs font-semibold text-slate-300">
            {skills.toLocaleString("fa-IR")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Award className="size-3.5 text-amber-300/80" aria-hidden="true" />
          امتیاز مشارکت {contributionScore.toLocaleString("fa-IR")}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" aria-hidden="true" />
          جامعه
        </span>
      </div>

      <div className="mt-5">
        {action ?? (
          <ButtonLink href={profileHref} variant="secondary" size="sm" fullWidth>
            مشاهده پروفایل
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
