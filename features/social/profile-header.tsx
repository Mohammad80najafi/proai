import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  MessageCircle,
  PencilLine,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/features/social/follow-button";
import type { ProfileDTO } from "@/features/social/data";
import { formatDate, formatNumber } from "@/lib/format";

type ProfileHeaderProps = {
  user: ProfileDTO["user"];
  isOwnProfile: boolean;
  isFollowing: boolean;
  canMessage: boolean;
};

function ConnectionStat({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 outline-none transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-cyan-300/[0.045] focus-visible:ring-2 focus-visible:ring-cyan-300/60 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-200 ring-1 ring-cyan-200/10 transition-colors group-hover:bg-cyan-300/[0.11]">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block text-base font-bold tabular-nums text-slate-100">
          {value}
        </strong>
        <span className="mt-0.5 block text-[11px] text-slate-500">{label}</span>
      </span>
    </Link>
  );
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
  canMessage,
}: ProfileHeaderProps) {
  return (
    <Card className="relative isolate overflow-hidden border-indigo-300/15 bg-[#0b101b] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -start-40 -top-64 size-[34rem] rounded-full border border-indigo-300/10 shadow-[inset_0_0_90px_rgba(99,102,241,0.07)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -start-16 -top-36 size-80 rounded-full border border-cyan-200/[0.07]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-200/45 to-transparent"
        aria-hidden="true"
      />

      <div className="relative p-5 sm:p-7 lg:p-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-start">
            <div className="relative shrink-0 rounded-[2rem] bg-gradient-to-br from-cyan-200/55 via-indigo-400/35 to-transparent p-px shadow-[0_18px_45px_rgba(34,211,238,0.09)]">
              <div className="rounded-[calc(2rem-1px)] bg-[#0b101b] p-1.5">
                <Avatar
                  src={user.avatar}
                  fallback={user.displayName}
                  alt={user.displayName}
                  size="xl"
                  className="[&>span]:size-24 [&>span]:rounded-[1.55rem] [&>span]:text-2xl [&>span]:ring-0 sm:[&>span]:size-28"
                />
              </div>
              <span className="absolute -bottom-1 -end-1 grid size-8 place-items-center rounded-xl border-4 border-[#0b101b] bg-cyan-300 text-slate-950 shadow-lg">
                <UserRoundCheck className="size-3.5" aria-hidden="true" />
              </span>
            </div>

            <div className="min-w-0 pt-1">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <h1 className="max-w-2xl text-balance text-2xl font-black tracking-tight text-slate-50 sm:text-3xl lg:text-[2rem]">
                  {user.displayName}
                </h1>
                <span
                  className="inline-flex rounded-lg border border-white/[0.07] bg-black/15 px-2.5 py-1 font-mono text-[11px] text-indigo-200/70"
                  dir="ltr"
                >
                  @{user.username}
                </span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px] sm:leading-8">
                {user.bio || "هنوز توضیحی برای این پروفایل نوشته نشده است."}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-2 sm:justify-start lg:w-auto lg:max-w-sm lg:justify-end">
            {isOwnProfile ? (
              <>
                <ButtonLink href="/settings" variant="secondary">
                  <PencilLine className="size-4" aria-hidden="true" />
                  ویرایش پروفایل
                </ButtonLink>
                <ButtonLink href="/saved" variant="outline">
                  <Bookmark className="size-4" aria-hidden="true" />
                  ذخیره‌ها
                </ButtonLink>
              </>
            ) : (
              <>
                <FollowButton userId={user.id} initialFollowing={isFollowing} />
                {canMessage ? (
                  <ButtonLink href={`/messages/new?user=${user.username}`} variant="outline">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    پیام
                  </ButtonLink>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-2 border-t border-white/[0.065] pt-5 sm:grid-cols-3">
          <ConnectionStat
            href={`/users/${user.username}/connections?tab=followers`}
            icon={<Users className="size-4" aria-hidden="true" />}
            value={formatNumber(user.stats.followers)}
            label="دنبال‌کننده"
          />
          <ConnectionStat
            href={`/users/${user.username}/connections?tab=following`}
            icon={<UserRoundCheck className="size-4" aria-hidden="true" />}
            value={formatNumber(user.stats.following)}
            label="دنبال‌شده"
          />
          <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-300/[0.07] text-indigo-200 ring-1 ring-indigo-200/10">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block text-sm font-semibold text-slate-200">
                {formatDate(user.createdAt)}
              </strong>
              <span className="mt-0.5 block text-[11px] text-slate-500">تاریخ عضویت</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
