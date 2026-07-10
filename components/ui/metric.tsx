import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "./cn";

export function Metric({
  label,
  value,
  icon,
  trend,
  helper,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; direction: "up" | "down" };
  helper?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-white/[0.028] p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon ? (
          <span className="grid size-8 place-items-center rounded-xl bg-white/[0.045] text-slate-400 [&>svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <strong className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
          {value}
        </strong>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              trend.direction === "up" ? "text-emerald-300" : "text-red-300",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownLeft className="size-3" aria-hidden="true" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-[11px] text-slate-600">{helper}</p> : null}
    </div>
  );
}
