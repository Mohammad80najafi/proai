import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Braces,
  Clock3,
  Mail,
  Radio,
  Shapes,
  Sparkles,
  TrendingUp,
  WandSparkles,
} from "lucide-react";

import { getNewsStories, type NewsStory } from "@/features/news/data";

const topics = [
  { label: "مدل‌های زبانی", count: "۱۲ مطلب", tone: "bg-[#caffdf]" },
  { label: "ایجنت‌ها", count: "۹ مطلب", tone: "bg-[#c9dcff]" },
  { label: "توسعه نرم‌افزار", count: "۱۶ مطلب", tone: "bg-[#ffd6ad]" },
  { label: "رسانه مولد", count: "۷ مطلب", tone: "bg-[#e8d2ff]" },
] as const;

function ReadingMeta({ date, readTime }: { date: string; readTime: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[10px] text-faint">
      <span>{date}</span>
      <span className="size-0.5 rounded-full bg-current" />
      <span className="inline-flex items-center gap-1">
        <Clock3 className="size-3" strokeWidth={1.5} aria-hidden="true" />
        {readTime} مطالعه
      </span>
    </p>
  );
}

function EditorialPulse({ stories }: { stories: NewsStory[] }) {
  const pulseStories = stories.slice(0, 3);

  return (
    <section
      className="home-reveal home-reveal-delay-1 -mt-14 sm:-mt-20"
      aria-labelledby="editorial-pulse-title"
    >
      <div className="surface-noise relative overflow-hidden rounded-[1.75rem] bg-[#0c111b] ring-1 ring-white/[0.07]">
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#8effc1]/70 to-transparent"
          aria-hidden="true"
        />
        <div className="grid lg:grid-cols-[minmax(190px,.62fr)_repeat(3,minmax(0,1fr))]">
          <header className="flex items-center justify-between gap-5 border-b border-white/[0.07] px-5 py-5 lg:block lg:border-e lg:border-b-0 lg:p-6">
            <div>
              <div className="flex items-center gap-2 text-[#8effc1]">
                <span className="grid size-8 place-items-center rounded-full bg-[#8effc1]/10 ring-1 ring-[#8effc1]/20">
                  <Radio className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
                </span>
                <p id="editorial-pulse-title" className="text-xs font-bold">نبض تحریریه</p>
              </div>
              <p className="mt-3 hidden max-w-36 text-[10px] leading-5 text-faint lg:block">
                سه خبر مهم برای شروع امروز
              </p>
            </div>
            <span className="text-[9px] font-semibold tracking-[0.16em] text-faint lg:mt-8 lg:block" dir="ltr">
              QUICK READ
            </span>
          </header>

          {pulseStories.map((story, index) => (
            <Link
              key={story.slug}
              href={`/news/${story.slug}`}
              className={`group relative min-w-0 px-5 py-5 transition-colors duration-500 hover:bg-white/[0.035] lg:px-6 lg:py-6 ${
                index < pulseStories.length - 1
                  ? "border-b border-white/[0.07] lg:border-e lg:border-b-0"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className={`font-bold ${story.accentText}`}>{story.source}</span>
                <span className="text-faint">{story.date}</span>
              </div>
              <h2 className="pretty-text mt-3 line-clamp-2 text-sm font-bold leading-7 text-slate-200 transition-colors duration-500 group-hover:text-white">
                {story.title}
              </h2>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-faint transition-colors duration-500 group-hover:text-slate-300">
                مطالعه خبر
                <ArrowLeft
                  className="size-3 transition-transform duration-500 group-hover:-translate-x-1"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const newsStories = await getNewsStories();
  const leadStory = newsStories[0];
  const homeNewsItems = newsStories.slice(1);
  if (!leadStory) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-center">
        <div><Radio className="mx-auto size-8 text-faint" /><h1 className="mt-5 text-3xl font-black">اتاق خبر در حال آماده‌سازی است</h1><p className="mt-3 text-sm text-muted">به‌زودی خبرهای تازه اینجا منتشر می‌شوند.</p></div>
      </div>
    );
  }
  const secondaryStories = homeNewsItems.slice(0, 2);
  const feedStories = homeNewsItems.slice(2);

  return (
    <div className="space-y-20 overflow-hidden pb-10 sm:space-y-28">
      <header className="home-reveal border-b border-white/[0.08] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-primary-strong">PROAI EDITORIAL</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-6xl">روزنامه هوش مصنوعی</h1>
          </div>
          <div className="text-end text-[11px] leading-6 text-faint">
            <p>شماره ۱۲۴</p>
            <p>شنبه، ۲۰ تیر ۱۴۰۵</p>
          </div>
        </div>

        <nav className="scrollbar-subtle mt-7 flex gap-2 overflow-x-auto pb-2" aria-label="موضوعات خبر">
          {["تازه‌ترین", "مدل‌ها", "ایجنت‌ها", "کدنویسی", "پژوهش", "رسانه مولد", "کسب‌وکار"].map((topic, index) => (
            <a
              key={topic}
              href={index === 0 ? "#latest" : "#topics"}
              className={`shrink-0 rounded-full px-4 py-2 text-xs ring-1 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${index === 0 ? "bg-white text-[#090d14] ring-white" : "bg-white/[0.035] text-muted ring-white/[0.07] hover:bg-white/[0.08] hover:text-white"}`}
            >
              {topic}
            </a>
          ))}
        </nav>
      </header>

      <EditorialPulse stories={homeNewsItems} />

      <section className="home-reveal home-reveal-delay-1 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)]" aria-label="داستان‌های اصلی">
        <Link
          href={`/news/${leadStory.slug}`}
          className="group relative min-h-[570px] overflow-hidden rounded-[2rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.06] sm:min-h-[640px]"
        >
          <div className="relative h-full min-h-[558px] overflow-hidden rounded-[calc(2rem-0.375rem)] sm:min-h-[628px]">
            <Image
              src={leadStory.coverImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 70vw"
              className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05080d] via-[#05080d]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold text-[#07110d] ${leadStory.accent}`}>داستان جلد</span>
                <span className="rounded-full bg-black/35 px-3 py-1.5 text-[10px] text-slate-200 ring-1 ring-white/15">{leadStory.category}</span>
              </div>
              <h2 className="balanced-text max-w-4xl text-[2.4rem] font-black leading-[1.3] tracking-[-0.05em] sm:text-6xl lg:text-[4.5rem]">
                {leadStory.title}
              </h2>
              <p className="pretty-text mt-5 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">{leadStory.summary}</p>
              <div className="mt-6 flex items-center justify-between gap-4">
                <ReadingMeta date={leadStory.date} readTime={leadStory.readTime} />
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#08110d] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1">
                  <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {secondaryStories.map((story) => (
            <Link key={story.slug} href={`/news/${story.slug}`} className="group flex min-h-[280px] flex-col overflow-hidden rounded-[1.75rem] bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06] xl:min-h-0">
              <div className="relative min-h-40 flex-1 overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[#0a0f17]">
                <Image src={story.coverImage} alt="" fill sizes="(max-width: 640px) 100vw, 35vw" className="object-cover opacity-80 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-transparent to-transparent" />
                <span className={`absolute end-4 top-4 size-3 rounded-full ${story.accent}`} />
              </div>
              <div className="px-3 pb-4 pt-5 sm:px-5">
                <p className="text-[10px] font-semibold text-primary-strong">{story.category} · {story.source}</p>
                <h3 className="pretty-text mt-2 text-lg font-bold leading-8">{story.title}</h3>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <ReadingMeta date={story.date} readTime={story.readTime} />
                  <ArrowLeft className="size-4 text-faint transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:text-white" strokeWidth={1.4} aria-hidden="true" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-reveal home-reveal-delay-2" aria-labelledby="briefing-title">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.17em] text-primary-strong">THE BRIEFING</p>
            <h2 id="briefing-title" className="mt-2 text-3xl font-black tracking-[-0.04em]">مرور سریع امروز</h2>
          </div>
          <p className="flex items-center gap-2 text-[10px] text-faint">
            <ArrowLeft className="size-3.5" strokeWidth={1.4} aria-hidden="true" />
            برای مرور، کارت‌ها را بکشید
          </p>
        </div>
        <div className="scrollbar-subtle -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8">
          {homeNewsItems.map((story) => (
            <Link key={story.slug} href={`/news/${story.slug}`} className="group w-[82vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/[0.06] sm:w-[360px]">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0f17]">
                <Image src={story.coverImage} alt="" fill sizes="390px" className="object-cover opacity-75 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                <div className={`absolute inset-x-0 bottom-0 h-1 ${story.accent}`} />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-semibold text-primary-strong">{story.source}</p>
                <h3 className="pretty-text mt-2 text-base font-bold leading-7">{story.title}</h3>
                <p className="pretty-text mt-3 text-xs leading-6 text-muted">{story.summary}</p>
              </div>
            </Link>
          ))}
          <div className="w-8 shrink-0" aria-hidden="true" />
        </div>
      </section>

      <section id="latest" className="home-reveal home-reveal-delay-2 scroll-mt-24" aria-labelledby="latest-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-16">
          <div>
            <div className="mb-7 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-primary-strong">LATEST STORIES</p>
                <h2 id="latest-title" className="mt-2 text-3xl font-black tracking-[-0.04em]">تازه‌ترین مطالب</h2>
              </div>
              <Radio className="size-5 text-[#8effc1]" strokeWidth={1.4} aria-hidden="true" />
            </div>

            <div className="divide-y divide-white/[0.08]">
              {[...feedStories, ...secondaryStories].map((story) => (
                <article key={story.slug} className="py-7 first:pt-0">
                  <Link href={`/news/${story.slug}`} className="group grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0a0f17]">
                      <Image src={story.coverImage} alt="" fill sizes="(max-width: 640px) 100vw, 220px" className="object-cover opacity-80 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                      <span className={`absolute end-3 top-3 size-2.5 rounded-full ${story.accent}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-primary-strong">{story.category} · {story.source}</p>
                      <h3 className="pretty-text mt-2 text-xl font-black leading-9 tracking-[-0.025em] transition-colors duration-500 group-hover:text-white sm:text-2xl">{story.title}</h3>
                      <p className="pretty-text mt-3 text-sm leading-7 text-muted">{story.summary}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <ReadingMeta date={story.date} readTime={story.readTime} />
                        <Bookmark className="size-4 text-faint" strokeWidth={1.4} aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.06]">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary-strong" strokeWidth={1.5} aria-hidden="true" />
                <h2 className="text-sm font-bold">بیشتر خوانده‌شده</h2>
              </div>
              <ol className="mt-5 divide-y divide-white/[0.07]">
                {newsStories.slice(0, 4).map((story, index) => (
                  <li key={story.slug}>
                    <Link href={`/news/${story.slug}`} className="group flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="font-mono text-xl font-bold text-white/15">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="text-[10px] text-primary-strong">{story.source}</p>
                        <h3 className="pretty-text mt-1 text-xs font-semibold leading-6 text-slate-300 transition-colors duration-500 group-hover:text-white">{story.title}</h3>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] bg-[#caffdf] p-6 text-[#07110d]">
              <Mail className="size-5" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="mt-9 text-2xl font-black leading-9">خلاصه مهم‌ها، هفته‌ای یک‌بار.</h2>
              <p className="mt-3 text-xs leading-6 text-black/60">تحلیل خبرهای هوش مصنوعی برای سازندگان، بدون شلوغی.</p>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#081a12] px-5 py-2.5 text-xs font-semibold text-white">
                عضویت رایگان
                <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section id="topics" className="home-reveal home-reveal-delay-3 scroll-mt-24" aria-labelledby="topics-title">
        <div className="mb-7">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-primary-strong">EXPLORE TOPICS</p>
          <h2 id="topics-title" className="mt-2 text-3xl font-black tracking-[-0.04em]">موضوعات داغ</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {topics.map((topic) => (
            <a key={topic.label} href="#latest" className="group flex min-h-36 flex-col justify-between rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <span className={`size-3 rounded-full ${topic.tone}`} />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-bold">{topic.label}</h3>
                  <p className="mt-1 text-[10px] text-faint">{topic.count}</p>
                </div>
                <ArrowLeft className="size-4 text-faint transition-transform duration-700 group-hover:-translate-x-1 group-hover:text-white" strokeWidth={1.4} aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="home-reveal home-reveal-delay-3 rounded-[2rem] bg-[#f1eee5] p-2 text-[#11130f]">
        <div className="rounded-[calc(2rem-0.5rem)] bg-[#e8e4d8] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#496154]">
                <WandSparkles className="size-4" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-[10px] font-bold tracking-[0.16em]">FROM NEWS TO PRACTICE</p>
              </div>
              <h2 className="balanced-text mt-4 text-4xl font-black leading-[1.35] tracking-[-0.045em]">خبر را بخوانید؛ بعد آن را امتحان کنید.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { href: "/ai/analyzer", label: "تحلیل پرامپت", helper: "آماده برای مدل‌های تازه", icon: Sparkles },
                { href: "/explore?type=prompts", label: "پرامپت‌ها", helper: "منتخب جامعه", icon: Braces },
                { href: "/explore?type=skills", label: "مهارت‌ها", helper: "گردش‌کارهای واقعی", icon: Shapes },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group rounded-[1.25rem] bg-white/45 p-5 ring-1 ring-black/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                    <Icon className="size-5 text-[#496154]" strokeWidth={1.4} aria-hidden="true" />
                    <h3 className="mt-8 font-bold">{item.label}</h3>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-black/50">
                      <span>{item.helper}</span>
                      <ArrowLeft className="size-3.5 transition-transform duration-700 group-hover:-translate-x-1" strokeWidth={1.4} aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
