import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Braces,
  GitPullRequestArrow,
  ScanSearch,
  Shapes,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { PromptCard } from "@/components/ui/prompt-card";
import { SearchBox } from "@/components/ui/search-box";
import { SkillCard } from "@/components/ui/skill-card";
import { getExploreContent, getPlatformStats } from "@/features/content/data";
import { formatNumber } from "@/lib/format";

async function getHomeData() {
  try {
    const [content, stats] = await Promise.all([
      getExploreContent({ sort: "popular", limit: 4 }),
      getPlatformStats(),
    ]);
    return { content, stats, connected: true as const };
  } catch {
    return {
      content: { prompts: [], skills: [] },
      stats: { prompts: 0, skills: 0, users: 0, improvements: 0 },
      connected: false as const,
    };
  }
}

export default async function HomePage() {
  const { content, stats, connected } = await getHomeData();

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(390px,.9fr)] xl:items-stretch">
        <div className="flex min-h-[430px] flex-col justify-center py-6 sm:py-10 xl:pe-8">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-strong">
            <Sparkles className="size-3.5" aria-hidden="true" />
            دانش جمعی برای عصر هوش مصنوعی
          </div>
          <h1 className="balanced-text max-w-3xl text-[2.65rem] font-black leading-[1.28] tracking-[-0.035em] text-white sm:text-6xl xl:text-[4.4rem]">
            هوش مصنوعی با <span className="text-primary-strong">دانش جمعی</span> بهتر می‌شود.
          </h1>
          <p className="pretty-text mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg sm:leading-9">
            پرامپت‌ها و مهارت‌های حرفه‌ای را کشف کنید، برایشان بهبود پیشنهاد دهید و دانش بهتر را با جامعه به اشتراک بگذارید.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/explore" size="lg">
              شروع کاوش
              <ArrowLeft className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/prompts/new" variant="outline" size="lg">
              <Braces className="size-4" aria-hidden="true" />
              ساخت اولین پرامپت
            </ButtonLink>
          </div>
          <SearchBox className="mt-8 max-w-2xl" shortcut="↵" />
        </div>

        <Card elevated className="surface-noise intelligence-rail relative overflow-hidden p-1">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-strong">
                <GitPullRequestArrow className="size-[18px]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">پیشنهاد بهبود #۲۴</p>
                <p className="mt-0.5 text-[11px] text-faint">تحلیل‌گر ارشد محصول · نسخه ۳</p>
              </div>
            </div>
            <span className="rounded-lg border border-warning/20 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning">
              در حال بررسی
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <div className="mb-3 flex items-center justify-between text-[11px] text-faint">
                <span>تغییر پیشنهادی</span>
                <span dir="ltr">+18 / −4</span>
              </div>
              <div className="technical-content rounded-xl border border-white/[0.07] bg-[#080c14] p-4 text-xs leading-7 text-slate-400">
                <p className="text-success">+ Define the audience and product stage.</p>
                <p className="text-success">+ Return risks with confidence levels.</p>
                <p className="text-danger/80">− Give me product feedback.</p>
                <p className="mt-2 text-primary-strong">+ Output: Persian Markdown table</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-[10px] text-faint">وضوح</p>
                <p className="mt-2 text-lg font-bold text-white">۹۲</p>
              </div>
              <div className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-[10px] text-faint">ساختار</p>
                <p className="mt-2 text-lg font-bold text-white">۸۸</p>
              </div>
              <div className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-[10px] text-faint">امتیاز AI</p>
                <p className="mt-2 text-lg font-bold text-primary-strong">۹۰</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-success/15 bg-success/[0.06] p-3 text-xs text-slate-300">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
                <GitPullRequestArrow className="size-4" aria-hidden="true" />
              </div>
              پذیرش این پیشنهاد، نسخه رسمی بعدی را با نام مشارکت‌کننده می‌سازد.
            </div>
          </div>
        </Card>
      </section>

      {!connected ? (
        <section className="rounded-2xl border border-warning/20 bg-warning/[0.055] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3">
            <ScanSearch className="mt-1 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-slate-100">پایگاه داده محلی هنوز اجرا نشده است</h2>
              <p className="mt-1 text-sm leading-7 text-muted">برای دیدن داده‌های نمونه، MongoDB را اجرا و فرمان seed را اجرا کنید.</p>
            </div>
          </div>
          <code className="mt-4 block rounded-lg bg-black/25 px-3 py-2 text-[11px] text-slate-400 sm:mt-0" dir="ltr">
            npm run db:up &amp;&amp; npm run seed
          </code>
        </section>
      ) : null}

      <section aria-labelledby="platform-stats">
        <h2 id="platform-stats" className="sr-only">آمار جامعه</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="پرامپت منتشرشده" value={formatNumber(stats.prompts)} icon={<Braces />} helper="نسخه‌پذیر و قابل بهبود" />
          <Metric label="مهارت تخصصی" value={formatNumber(stats.skills)} icon={<Shapes />} helper="دانش، ابزار و گردش کار" />
          <Metric label="سازنده فعال" value={formatNumber(stats.users)} icon={<UsersRound />} helper="جامعه‌ای رو به رشد" />
          <Metric label="بهبود پذیرفته‌شده" value={formatNumber(stats.improvements)} icon={<GitPullRequestArrow />} helper="اعتبار کامل برای مشارکت‌کننده" />
        </div>
      </section>

      <section aria-labelledby="popular-prompts">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">منتخب جامعه</p>
            <h2 id="popular-prompts" className="mt-2 text-2xl font-bold">پرامپت‌های درخشان این هفته</h2>
          </div>
          <Link href="/explore?type=prompts" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
            مشاهده همه
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {content.prompts.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
          </div>
        ) : (
          <Card className="grid min-h-44 place-items-center p-8 text-center text-sm text-muted">بعد از اجرای seed، پرامپت‌های منتخب اینجا دیده می‌شوند.</Card>
        )}
      </section>

      <section aria-labelledby="featured-skills">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">دانش قابل استفاده</p>
            <h2 id="featured-skills" className="mt-2 text-2xl font-bold">مهارت‌های ساخته‌شده برای کار واقعی</h2>
          </div>
          <Link href="/explore?type=skills" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
            مشاهده همه
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {content.skills.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
          <Card className="grid min-h-44 place-items-center p-8 text-center text-sm text-muted">مهارت‌های نمونه پس از آماده‌شدن پایگاه داده نمایش داده می‌شوند.</Card>
        )}
      </section>

      <section className="overflow-hidden rounded-[18px] border border-primary/20 bg-primary-soft px-6 py-8 sm:px-9 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-primary-strong">
              <Bot className="size-5" aria-hidden="true" />
              <span className="text-sm font-semibold">تحلیل و بهبود با هوش مصنوعی</span>
            </div>
            <h2 className="balanced-text mt-3 text-2xl font-bold sm:text-3xl">قبل از انتشار، نقاط ضعف پرامپت را پیدا کنید.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-muted">تحلیل‌گر ProAI وضوح، ساختار، زمینه، محدودیت‌ها و قالب خروجی را بررسی می‌کند و پیشنهادهای عملی می‌دهد.</p>
          </div>
          <ButtonLink href="/ai/analyzer" size="lg">
            <Sparkles className="size-4" aria-hidden="true" />
            تحلیل یک پرامپت
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
