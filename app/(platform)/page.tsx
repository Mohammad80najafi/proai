import Link from "next/link";
import {
  ArrowLeft,
  Braces,
  Clock3,
  Cpu,
  Radio,
  Shapes,
  Sparkles,
} from "lucide-react";

import { NewsCarousel } from "@/components/home/news-carousel";
import { PromptCard } from "@/components/ui/prompt-card";
import { SkillCard } from "@/components/ui/skill-card";
import { getExploreContent } from "@/features/content/data";
import { homeNewsItems, leadStory } from "@/features/news/data";

const briefings = [
  {
    label: "برای سازندگان",
    title: "APIها به سمت انتخاب مدل بر اساس هزینه و عمق کار می‌روند.",
  },
  {
    label: "برای تیم‌ها",
    title: "ایجنت کدنویسی دیگر فقط کد تولید نمی‌کند؛ پروژه را دنبال می‌کند.",
  },
  {
    label: "برای خلاق‌ها",
    title: "واترمارک نامرئی به بخشی از تجربه تولید تصویر تبدیل می‌شود.",
  },
] as const;

async function getCommunityContent() {
  try {
    return await getExploreContent({ sort: "popular", limit: 2 });
  } catch {
    return { prompts: [], skills: [] };
  }
}

export default async function HomePage() {
  const content = await getCommunityContent();

  return (
    <div className="space-y-24 overflow-hidden pb-8 sm:space-y-32">
      <section className="home-reveal relative">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-slate-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#8effc1] opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-[#8effc1]" />
            </span>
            رادار هوش مصنوعی
          </div>
          <p className="flex items-center gap-2 text-[11px] text-faint">
            <Clock3 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            به‌روزرسانی تحریریه · ۲۰ تیر ۱۴۰۵
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.65fr)]">
          <article className="group relative min-h-[560px] overflow-hidden rounded-[2rem] bg-[#d9ffef] p-2 text-[#07110d] sm:min-h-[620px]">
            <div className="relative flex h-full min-h-[544px] flex-col overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[#caffdf] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:min-h-[604px] sm:px-10 sm:py-9 lg:px-14 lg:py-12">
              <div className="pointer-events-none absolute -left-20 -top-28 size-[420px] rounded-full border-[70px] border-[#0d3728]/[0.06] transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110" />
              <div className="pointer-events-none absolute bottom-16 left-8 font-mono text-[11rem] font-bold leading-none text-[#09281c]/[0.045] sm:text-[16rem]">
                5.6
              </div>

              <div className="relative flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-[#082419] px-3 py-1.5 text-[#caffdf]">خبر اول</span>
                <span className="rounded-full bg-black/[0.055] px-3 py-1.5">{leadStory.category}</span>
              </div>

              <div className="relative mt-auto max-w-4xl pt-20">
                <p className="mb-4 text-xs font-semibold text-[#285443]">
                  {leadStory.source} · {leadStory.date}
                </p>
                <h1 className="balanced-text text-[2.6rem] font-black leading-[1.22] tracking-[-0.055em] sm:text-6xl lg:text-[5.3rem]">
                  {leadStory.title}
                </h1>
                <p className="pretty-text mt-6 max-w-2xl text-sm leading-8 text-[#315a4a] sm:text-base sm:leading-9">
                  {leadStory.summary}
                </p>
                <Link
                  href={`/news/${leadStory.slug}`}
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#082419] py-2 pe-2 ps-6 text-sm font-semibold text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[0.98]"
                >
                  خواندن تحلیل خبر
                  <span className="grid size-8 place-items-center rounded-full bg-white/10">
                    <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </div>
          </article>

          <aside className="rounded-[2rem] bg-white/[0.055] p-2 ring-1 ring-white/[0.06]">
            <div className="h-full rounded-[calc(2rem-0.5rem)] bg-[#0b1019] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-7 sm:py-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-primary-strong">AI PULSE</p>
                  <h2 className="mt-2 text-xl font-bold">روی خط خبر</h2>
                </div>
                <Radio className="size-5 text-[#8effc1]" strokeWidth={1.4} aria-hidden="true" />
              </div>

              <div className="relative mt-8 space-y-0 before:absolute before:bottom-4 before:right-[5px] before:top-3 before:w-px before:bg-gradient-to-b before:from-[#8effc1] before:via-white/10 before:to-transparent">
                {homeNewsItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group relative block py-5 pe-7 first:pt-1"
                  >
                    <span className={`absolute right-0 top-7 size-[11px] rounded-full ring-4 ring-[#0b1019] first:top-2 ${item.accent}`} />
                    <div className="flex items-center gap-2 text-[10px] text-faint">
                      <span>{item.date}</span>
                      <span className="size-0.5 rounded-full bg-faint" />
                      <span>{item.source}</span>
                    </div>
                    <h3 className="pretty-text mt-2 text-sm font-semibold leading-7 text-slate-200 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-white">
                      {item.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <NewsCarousel items={homeNewsItems} />

      <section className="home-reveal home-reveal-delay-2 rounded-[2rem] bg-[#f3f0e8] p-2 text-[#11130f]" aria-labelledby="why-it-matters">
        <div className="rounded-[calc(2rem-0.5rem)] bg-[#ebe7dc] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#5d5d50]">WHY IT MATTERS</p>
              <h2 id="why-it-matters" className="balanced-text mt-4 text-4xl font-black leading-[1.35] tracking-[-0.045em] sm:text-5xl">
                معنای خبرها، بدون هیاهو.
              </h2>
            </div>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {briefings.map((briefing) => (
                <div key={briefing.label} className="grid gap-2 py-5 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <p className="text-xs font-bold text-[#647064]">{briefing.label}</p>
                  <p className="text-base font-semibold leading-8 sm:text-lg">{briefing.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-reveal home-reveal-delay-3" aria-labelledby="community-picks">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-strong">
              <Sparkles className="size-4" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-[11px] font-semibold">از خبر تا عمل</p>
            </div>
            <h2 id="community-picks" className="mt-3 text-3xl font-black tracking-[-0.035em]">
              انتخاب امروز جامعه ProAI
            </h2>
          </div>
          <Link href="/explore" className="group inline-flex w-fit items-center gap-3 rounded-full bg-white/[0.06] py-2 pe-2 ps-5 text-sm text-slate-200 ring-1 ring-white/[0.07] transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.1] hover:text-white">
            کاوش همه محتوا
            <span className="grid size-8 place-items-center rounded-full bg-white/10">
              <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </span>
          </Link>
        </div>

        {content.prompts.length || content.skills.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {content.prompts.map((prompt, index) => (
              <PromptCard
                key={prompt.id}
                id={prompt.slug}
                href={`/prompts/${prompt.slug}`}
                title={prompt.title}
                description={prompt.description}
                author={prompt.author}
                category={prompt.category}
                tags={prompt.tags}
                version={prompt.version}
                featured={index === 0}
                stats={{ likes: prompt.stats.likes, saves: prompt.stats.saves, forks: prompt.stats.forks, rating: prompt.stats.ratingAverage }}
              />
            ))}
            {content.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                id={skill.slug}
                href={`/skills/${skill.slug}`}
                name={skill.title}
                description={skill.description}
                creator={skill.author}
                modules={skill.tags}
                forks={skill.stats.forks}
                rating={skill.stats.ratingAverage}
                version={skill.version}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/explore?type=prompts" className="group flex min-h-44 items-end justify-between rounded-[1.75rem] bg-white/[0.04] p-7 ring-1 ring-white/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <div>
                <Braces className="mb-6 size-5 text-primary-strong" strokeWidth={1.4} aria-hidden="true" />
                <h3 className="text-lg font-bold">کاوش پرامپت‌ها</h3>
                <p className="mt-2 text-sm text-muted">دستورهای آماده برای تجربه مدل‌های تازه</p>
              </div>
              <ArrowLeft className="size-4 text-faint" strokeWidth={1.4} aria-hidden="true" />
            </Link>
            <Link href="/explore?type=skills" className="group flex min-h-44 items-end justify-between rounded-[1.75rem] bg-white/[0.04] p-7 ring-1 ring-white/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <div>
                <Shapes className="mb-6 size-5 text-[#8effc1]" strokeWidth={1.4} aria-hidden="true" />
                <h3 className="text-lg font-bold">کشف مهارت‌ها</h3>
                <p className="mt-2 text-sm text-muted">گردش‌کارهای ساخته‌شده برای استفاده واقعی</p>
              </div>
              <ArrowLeft className="size-4 text-faint" strokeWidth={1.4} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="home-reveal home-reveal-delay-3 flex flex-col items-start justify-between gap-6 border-t border-white/[0.07] pt-10 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
            <Cpu className="size-5" strokeWidth={1.4} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold">خبر را به یک تجربه واقعی تبدیل کنید.</h2>
            <p className="mt-1 text-sm leading-7 text-muted">با تحلیل‌گر ProAI یک پرامپت را برای مدل‌های جدید آماده و ارزیابی کنید.</p>
          </div>
        </div>
        <Link href="/ai/analyzer" className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-primary py-2 pe-2 ps-5 text-sm font-semibold text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[0.98]">
          شروع تحلیل
          <span className="grid size-8 place-items-center rounded-full bg-white/15">
            <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </div>
  );
}
