import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "./cn";

export interface TabItem {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

export function Tabs({
  items,
  activeKey,
  label = "بخش‌های صفحه",
  className,
}: {
  items: TabItem[];
  activeKey: string;
  label?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.disabled ? -1 : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none sm:gap-2 sm:px-3",
              active
                ? "bg-white/[0.09] text-white shadow-sm"
                : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200",
              item.disabled && "pointer-events-none opacity-40",
            )}
          >
            {item.icon ? (
              <span className="[&>svg]:size-3.5" aria-hidden>
                {item.icon}
              </span>
            ) : null}
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "hidden rounded-md px-1.5 py-0.5 text-[10px] tabular-nums sm:inline",
                  active ? "bg-white/10 text-slate-200" : "bg-white/[0.05] text-slate-500",
                )}
              >
                {item.count.toLocaleString("fa-IR")}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
