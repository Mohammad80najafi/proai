import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Logo } from "@/components/ui/logo";

import {
  isNavigationItemActive,
  primaryNavigation,
  type NavigationItem,
} from "./navigation";

export interface DesktopSidebarProps {
  activePath?: string;
  items?: NavigationItem[];
  user?: {
    displayName: string;
    username: string;
    avatar?: string | null;
    rank?: string;
  };
  footer?: ReactNode;
  className?: string;
}

export function DesktopSidebar({
  activePath,
  items = primaryNavigation,
  user,
  footer,
  className,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-white/[0.065] bg-[#080c15]/95 px-3 pb-4 pt-5 backdrop-blur-xl lg:flex",
        className,
      )}
      aria-label="نوار کناری اصلی"
    >
      <div className="px-2">
        <Logo />
      </div>

      <ButtonLink href="/prompts/new" className="mt-7" fullWidth>
        <Plus className="size-4" aria-hidden="true" />
        ساخت پرامپت
      </ButtonLink>

      <nav className="mt-6 flex-1" aria-label="ناوبری اصلی">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-wide text-slate-700">
          فضای کار
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(item, activePath);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none",
                    active
                      ? "bg-indigo-400/[0.11] text-indigo-100"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active
                        ? "text-indigo-300"
                        : "text-slate-600 group-hover:text-slate-400",
                    )}
                    strokeWidth={active ? 2.1 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="min-w-5 rounded-md bg-indigo-400/10 px-1.5 py-1 text-center text-[10px] leading-none text-indigo-200">
                      {typeof item.badge === "number"
                        ? item.badge.toLocaleString("fa-IR")
                        : item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-white/[0.055] pt-3">
        <Link
          href="/settings"
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-slate-500 outline-none transition-colors hover:bg-white/[0.04] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none"
        >
          <Settings className="size-[18px] text-slate-600" aria-hidden="true" />
          تنظیمات
        </Link>
        {footer ??
          (user ? (
            <Link
              href={`/users/${user.username}`}
              className="mt-2 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 outline-none transition-colors hover:bg-white/[0.045] focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none"
            >
              <Avatar
                src={user.avatar}
                alt={user.displayName}
                fallback={user.displayName}
                size="sm"
                status="online"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-200">
                  {user.displayName}
                </span>
                <span className="mt-1 block truncate text-[10px] text-slate-600">
                  {user.rank ?? "سازنده"}
                </span>
              </span>
            </Link>
          ) : (
            <ButtonLink href="/login" variant="outline" size="sm" fullWidth className="mt-2">
              ورود به حساب
            </ButtonLink>
          ))}
      </div>
    </aside>
  );
}
