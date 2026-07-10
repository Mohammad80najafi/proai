import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "./cn";

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.018] px-6 text-center",
        compact ? "min-h-52 py-8" : "min-h-80 py-12",
        className,
      )}
    >
      <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.045] text-slate-400 shadow-[0_12px_30px_rgba(0,0,0,0.16)] [&>svg]:size-5">
        {icon ?? <Inbox aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
