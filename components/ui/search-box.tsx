import type { FormHTMLAttributes } from "react";
import { Search } from "lucide-react";

import { cn } from "./cn";

export interface SearchBoxProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method"> {
  action?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  shortcut?: string;
  compact?: boolean;
}

export function SearchBox({
  action = "/explore",
  name = "q",
  defaultValue,
  placeholder = "جست‌وجوی پرامپت، مهارت یا کاربر…",
  label = "جست‌وجو در ProAI",
  shortcut = "/",
  compact = false,
  className,
  ...props
}: SearchBoxProps) {
  return (
    <form
      role="search"
      action={action}
      method="get"
      className={cn("relative w-full", className)}
      {...props}
    >
      <label htmlFor={`search-${name}`} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-slate-500"
        aria-hidden="true"
      />
      <input
        id={`search-${name}`}
        name={name}
        type="search"
        dir="auto"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-white/[0.085] bg-white/[0.035] ps-10 text-sm text-slate-100 outline-none transition-[border-color,background-color,box-shadow] placeholder:text-slate-600 hover:border-white/[0.14] focus:border-indigo-400/45 focus:bg-white/[0.05] focus:ring-4 focus:ring-indigo-500/10 motion-reduce:transition-none",
          compact ? "h-9 pe-3" : "h-11 pe-12",
        )}
      />
      {!compact && shortcut ? (
        <kbd
          className="pointer-events-none absolute inset-y-0 end-3 my-auto grid h-5 min-w-5 place-items-center rounded-md border border-white/[0.08] bg-white/[0.045] px-1 text-[10px] font-medium text-slate-500"
          aria-hidden="true"
        >
          {shortcut}
        </kbd>
      ) : null}
    </form>
  );
}
