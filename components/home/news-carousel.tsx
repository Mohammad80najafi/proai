"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoveHorizontal } from "lucide-react";

type NewsCard = {
  id: string;
  slug: string;
  category: string;
  source: string;
  title: string;
  summary: string;
  accent: string;
};

export function NewsCarousel({ items }: { items: readonly NewsCard[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.82, 440),
      behavior: "smooth",
    });
  }

  return (
    <section className="home-reveal home-reveal-delay-1" aria-labelledby="latest-news">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary-strong">LATEST SIGNALS</p>
          <h2 id="latest-news" className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
            سیگنال‌هایی که باید دنبال کنید
          </h2>
        </div>
        <div className="flex items-end justify-between gap-5 lg:justify-end">
          <p className="max-w-md text-sm leading-7 text-muted">
            گزیده‌ای کوتاه از خبرهایی که روی محصول، تیم و شیوه ساختن با هوش مصنوعی اثر می‌گذارند.
          </p>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => move(1)}
              className="grid size-10 place-items-center rounded-full bg-white/[0.055] text-muted ring-1 ring-white/[0.07] transition-[transform,color,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white active:scale-95"
              aria-label="خبرهای قبلی"
            >
              <ArrowRight className="size-4" strokeWidth={1.4} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(-1)}
              className="grid size-10 place-items-center rounded-full bg-white/[0.055] text-muted ring-1 ring-white/[0.07] transition-[transform,color,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white active:scale-95"
              aria-label="خبرهای بعدی"
            >
              <ArrowLeft className="size-4" strokeWidth={1.4} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="scrollbar-subtle -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="group w-[84vw] max-w-[410px] shrink-0 snap-start rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.055] sm:w-[390px] xl:w-[370px]"
          >
            <Link
              href={`/news/${item.slug}`}
              className="flex h-full min-h-80 flex-col rounded-[calc(1.75rem-0.375rem)] bg-[#0d131e] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`grid size-11 place-items-center rounded-full ${item.accent} font-mono text-[11px] font-bold text-[#0a1410]`}>
                  {item.id}
                </span>
                <ArrowLeft className="size-4 text-faint transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:text-white" strokeWidth={1.4} aria-hidden="true" />
              </div>
              <div className="mt-auto pt-12">
                <p className="text-[10px] font-semibold text-primary-strong">{item.category} · {item.source}</p>
                <h3 className="pretty-text mt-3 text-lg font-bold leading-8">{item.title}</h3>
                <p className="pretty-text mt-3 text-xs leading-6 text-muted">{item.summary}</p>
              </div>
            </Link>
          </div>
        ))}
        <div className="flex w-20 shrink-0 snap-end items-center justify-center text-faint" aria-hidden="true">
          <MoveHorizontal className="size-5" strokeWidth={1.2} />
        </div>
      </div>
      <p className="mt-1 flex items-center gap-2 text-[10px] text-faint sm:hidden">
        <MoveHorizontal className="size-3.5" strokeWidth={1.3} aria-hidden="true" />
        برای دیدن خبرهای بیشتر، کارت‌ها را بکشید.
      </p>
    </section>
  );
}
