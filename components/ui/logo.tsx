import Link from "next/link";
import { Braces } from "lucide-react";

import { cn } from "./cn";

function LogoContent({
  compact,
  name,
}: {
  compact: boolean;
  name: string;
}) {
  return (
    <>
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-indigo-300/20 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_9px_26px_rgba(79,70,229,0.25)]">
        <Braces className="size-5" strokeWidth={2.1} aria-hidden="true" />
        <span className="absolute start-1.5 top-1.5 size-1 rounded-full bg-cyan-200" aria-hidden />
        <span className="absolute bottom-1.5 end-1.5 size-1 rounded-full bg-violet-200" aria-hidden />
      </span>
      {compact ? null : (
        <span className="grid min-w-0 leading-none">
          <strong className="truncate text-[15px] font-bold tracking-tight text-white" dir="ltr">
            {name}
          </strong>
          <span className="mt-1.5 truncate text-[9px] font-medium tracking-wide text-slate-500">
            هوش، ساخته‌شده با هم
          </span>
        </span>
      )}
    </>
  );
}

export function Logo({
  href = "/",
  name = "ProAI",
  compact = false,
  className,
}: {
  href?: string | null;
  name?: string;
  compact?: boolean;
  className?: string;
}) {
  const classes = cn(
    "inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
    className,
  );

  if (!href) {
    return (
      <span className={classes} aria-label={name}>
        <LogoContent compact={compact} name={name} />
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={`${name}، صفحه اصلی`}>
      <LogoContent compact={compact} name={name} />
    </Link>
  );
}
