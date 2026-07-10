import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "indigo"
  | "blue"
  | "green"
  | "orange"
  | "red";

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: "border-white/[0.09] bg-white/[0.055] text-slate-300",
  indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
  blue: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  orange: "border-orange-400/20 bg-orange-400/10 text-orange-200",
  red: "border-red-400/20 bg-red-400/10 text-red-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium leading-none",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}
