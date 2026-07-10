import Link from "next/link";

import { cn } from "@/components/ui/cn";

import {
  isNavigationItemActive,
  mobileNavigation,
  type NavigationItem,
} from "./navigation";

export function MobileNav({
  activePath,
  items = mobileNavigation,
  className,
}: {
  activePath?: string;
  items?: NavigationItem[];
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.075] bg-[#080c15]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-xl lg:hidden",
        className,
      )}
      aria-label="ناوبری موبایل"
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isNavigationItemActive(item, activePath);

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mx-auto flex min-h-12 max-w-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none",
                  active
                    ? "bg-indigo-400/[0.1] text-indigo-200"
                    : "text-slate-600 active:bg-white/[0.05] active:text-slate-300",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                  {item.badge ? (
                    <span className="absolute -end-2.5 -top-1.5 min-w-4 rounded-full bg-indigo-500 px-1 text-center text-[8px] leading-4 text-white">
                      {typeof item.badge === "number"
                        ? item.badge.toLocaleString("fa-IR")
                        : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
