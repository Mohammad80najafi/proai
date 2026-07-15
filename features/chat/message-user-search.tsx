"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const LIVE_SEARCH_DELAY_MS = 250;

export function MessageUserSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function clearScheduledSearch() {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function navigateToSearch(value: string) {
    const term = value.trim();
    const href = term
      ? `/messages/new?q=${encodeURIComponent(term)}`
      : "/messages/new";

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    clearScheduledSearch();
    timerRef.current = setTimeout(() => navigateToSearch(value), LIVE_SEARCH_DELAY_MS);
  }

  return (
    <form
      action="/messages/new"
      method="get"
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={clearScheduledSearch}
      role="search"
    >
      <label htmlFor="message-user-search" className="sr-only">
        جست‌وجوی نام یا نام کاربری
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-faint"
          aria-hidden="true"
        />
        <input
          id="message-user-search"
          name="q"
          type="search"
          defaultValue={initialValue}
          onChange={handleChange}
          placeholder="نام یا نام کاربری؛ مثلاً تیم پروای‌آی"
          dir="auto"
          autoComplete="off"
          aria-busy={isPending}
          className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#090e18] ps-10 pe-10 text-base text-slate-100 outline-none transition-colors placeholder:text-faint hover:border-white/[0.14] focus:border-cyan-300/45 focus:ring-4 focus:ring-cyan-300/[0.07] sm:text-sm"
        />
        {isPending ? (
          <LoaderCircle
            className="pointer-events-none absolute inset-y-0 end-3.5 my-auto size-4 animate-spin text-cyan-200 motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <Button type="submit" className="h-12 px-6" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Search className="size-4" aria-hidden="true" />
        )}
        {isPending ? "در حال جست‌وجو…" : "جست‌وجو"}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {isPending ? "نتایج جست‌وجو در حال به‌روزرسانی است." : ""}
      </span>
    </form>
  );
}
