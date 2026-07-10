import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/components/ui/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("min-w-0", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="مسیر صفحه" className="mb-5">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
            {breadcrumbs.map((item, index) => {
              const current = index === breadcrumbs.length - 1;
              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 ? (
                    <ChevronLeft className="size-3 text-slate-700" aria-hidden="true" />
                  ) : null}
                  {item.href && !current ? (
                    <Link
                      href={item.href}
                      className="rounded-sm outline-none transition-colors hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={current ? "page" : undefined} className="text-slate-500">
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? (
            <div className="mb-3 text-xs font-semibold text-indigo-300">{eyebrow}</div>
          ) : null}
          <h1
            className="text-2xl font-bold leading-[1.45] tracking-tight text-white sm:text-3xl lg:text-[34px]"
            dir="auto"
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-[15px]" dir="auto">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-4 flex flex-wrap items-center gap-3">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
