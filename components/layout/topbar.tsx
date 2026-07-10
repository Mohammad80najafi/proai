import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, MessageCircle, Plus, Search } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Logo } from "@/components/ui/logo";
import { SearchBox } from "@/components/ui/search-box";

function IconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-transparent text-slate-500 outline-none transition-colors hover:border-white/[0.07] hover:bg-white/[0.045] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none"
      aria-label={count ? `${label}، ${count.toLocaleString("fa-IR")} خوانده‌نشده` : label}
    >
      {children}
      {count && count > 0 ? (
        <span className="absolute end-0.5 top-0.5 min-w-4 rounded-full border-2 border-[#080c15] bg-indigo-500 px-0.5 text-center text-[8px] font-semibold leading-3 text-white">
          {count > 99 ? "+۹۹" : count.toLocaleString("fa-IR")}
        </span>
      ) : null}
    </Link>
  );
}

export interface TopbarProps {
  user?: {
    displayName: string;
    username: string;
    avatar?: string | null;
  };
  notificationCount?: number;
  messageCount?: number;
  search?: ReactNode;
  showSearch?: boolean;
  createHref?: string;
  sidebarOffset?: boolean;
  className?: string;
}

export function Topbar({
  user,
  notificationCount = 0,
  messageCount = 0,
  search,
  showSearch = true,
  createHref = "/prompts/new",
  sidebarOffset = false,
  className,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-white/[0.06] bg-[#080c15]/80 backdrop-blur-xl",
        sidebarOffset && "lg:ms-64",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <div className="lg:hidden">
          <Logo compact />
        </div>

        {showSearch ? (
          <div className="hidden min-w-0 max-w-xl flex-1 md:block">
            {search ?? <SearchBox compact />}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className={cn("flex items-center gap-1", showSearch && "ms-auto")}>
          {showSearch ? (
            <span className="md:hidden">
              <IconLink href="/explore" label="جست‌وجو">
                <Search className="size-[18px]" aria-hidden="true" />
              </IconLink>
            </span>
          ) : null}
          {user ? (
            <>
              <IconLink href="/messages" label="پیام‌ها" count={messageCount}>
                <MessageCircle className="size-[18px]" aria-hidden="true" />
              </IconLink>
              <IconLink
                href="/notifications"
                label="اعلان‌ها"
                count={notificationCount}
              >
                <Bell className="size-[18px]" aria-hidden="true" />
              </IconLink>
              <ButtonLink
                href={createHref}
                size="sm"
                className="ms-1 hidden sm:inline-flex"
              >
                <Plus className="size-4" aria-hidden="true" />
                ساختن
              </ButtonLink>
              <Link
                href={`/users/${user.username}`}
                className="ms-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c15]"
                aria-label={`پروفایل ${user.displayName}`}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.displayName}
                  fallback={user.displayName}
                  size="sm"
                />
              </Link>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                ورود
              </ButtonLink>
              <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
                ساخت حساب
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
