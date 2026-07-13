import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  Check,
  Clock3,
  Link2,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ArticleActions } from "@/features/news/article-actions";
import { NewsCommentForm } from "@/features/news/comment-form";
import { getNewsComments } from "@/features/news/comment-data";
import { getNewsStories, getNewsStory } from "@/features/news/data";
import { getOptionalUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

type NewsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getNewsStory(slug);

  if (!story) return {};

  return {
    title: story.title,
    description: story.summary,
    openGraph: {
      type: "article",
      locale: "fa_IR",
      title: story.title,
      description: story.summary,
      images: [{ url: story.coverImage, alt: story.title }],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
  const { slug } = await params;
  const [stories, user] = await Promise.all([
    getNewsStories(),
    getOptionalUser().catch(() => null),
  ]);
  const story = stories.find((item) => item.slug === slug);

  if (!story) notFound();

  const comments = await getNewsComments(story.slug).catch(() => []);
  const relatedStories = stories.filter((item) => item.slug !== story.slug).slice(0, 3);

  return (
    <article className="home-reveal pb-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <Link href="/#latest-news" className="group inline-flex items-center gap-2 text-xs text-muted transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white">
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.5} aria-hidden="true" />
          بازگشت به رادار خبر
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-primary-strong">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#8effc1] opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-[#8effc1]" />
          </span>
          PROAI NEWSROOM
        </div>
      </div>

      <header className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className={`rounded-full px-3 py-1.5 text-[#07110d] ${story.accent}`}>{story.category}</span>
          <span className="rounded-full bg-white/[0.055] px-3 py-1.5 text-muted ring-1 ring-white/[0.07]">{story.source}</span>
        </div>
        <h1 className="balanced-text mt-7 max-w-4xl text-[2.55rem] font-black leading-[1.35] tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem]">
          {story.title}
        </h1>
        <p className="pretty-text mt-6 max-w-3xl text-base leading-9 text-slate-300 sm:text-lg sm:leading-10">
          {story.summary}
        </p>

        <div className="mt-8 flex flex-col gap-6 border-y border-white/[0.07] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar alt="تحریریه ProAI" fallback="P" size="md" />
            <div>
              <p className="text-sm font-bold">تحریریه ProAI</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <span>{story.dateFull}</span>
                <span className="size-0.5 rounded-full bg-current" />
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" strokeWidth={1.5} aria-hidden="true" />
                  {story.readTime} مطالعه
                </span>
              </p>
            </div>
          </div>
          <ArticleActions commentCount={comments.length} />
        </div>
      </header>

      <figure className="mx-auto mt-9 max-w-5xl">
        <div className="overflow-hidden rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.06]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[#0a0f17]">
            <Image
              src={story.coverImage}
              alt={`تصویر جلد: ${story.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
            <div className={`absolute inset-x-0 bottom-0 h-1 ${story.accent}`} />
          </div>
        </div>
        <figcaption className="mt-3 px-2 text-[10px] leading-6 text-faint">
          تصویرسازی اختصاصی ProAI برای پرونده {story.category}
        </figcaption>
      </figure>

      <div className="mx-auto mt-14 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,720px)_280px] lg:items-start lg:justify-center lg:gap-16">
        <div className="min-w-0">
          <div className="space-y-14">
            {story.sections.map((section, sectionIndex) => (
              <section key={section.heading} id={`section-${sectionIndex + 1}`} className="scroll-mt-24">
                <h2 className="balanced-text text-2xl font-black leading-[1.55] tracking-[-0.025em] sm:text-3xl">{section.heading}</h2>
                <div className="mt-5 space-y-5">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="pretty-text text-[15px] leading-9 text-slate-300 sm:text-[17px] sm:leading-10">{paragraph}</p>
                  ))}
                </div>
                {sectionIndex === 0 ? (
                  <blockquote className={`mt-9 rounded-e-[1.5rem] border-s-2 p-6 text-base font-semibold leading-9 text-slate-100 ${story.accentSoft}`}>
                    سیگنال اصلی این خبر: مزیت مدل‌های تازه فقط در پاسخ بهتر نیست؛ در توانایی دنبال‌کردن یک کار واقعی از ابتدا تا نتیجه است.
                  </blockquote>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.06]">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[#0d131e] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] sm:p-8">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-primary-strong">در یک نگاه</p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {story.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex items-start gap-3 text-xs leading-7 text-slate-300">
                    <span className={`mt-1.5 grid size-5 shrink-0 place-items-center rounded-full ${story.accent}`}>
                      <Check className="size-3 text-[#07110d]" strokeWidth={2} aria-hidden="true" />
                    </span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-2" aria-label="برچسب‌های مطلب">
            {[story.category, story.source, "هوش مصنوعی", "اخبار فناوری"].map((tag) => (
              <span key={tag} className="rounded-full bg-white/[0.045] px-3 py-1.5 text-[11px] text-muted ring-1 ring-white/[0.06]">#{tag}</span>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-6 border-y border-white/[0.07] py-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-primary-strong">PRIMARY SOURCE</p>
              <h2 className="mt-2 text-base font-bold">گزارش کامل را در {story.source} بخوانید</h2>
              <p className="mt-1 text-xs leading-6 text-muted">این مطلب خلاصه و تحلیل تحریریه ProAI از منبع اصلی است.</p>
            </div>
            <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-full bg-white py-2 pe-2 ps-5 text-sm font-semibold text-[#0b1019] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[0.98]">
              مشاهده منبع
              <span className="grid size-8 place-items-center rounded-full bg-black/[0.07]">
                <ArrowUpLeft className="size-3.5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </a>
          </div>

          <section id="comments" className="scroll-mt-24 pt-16" aria-labelledby="comments-title">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-primary-strong">DISCUSSION</p>
                <h2 id="comments-title" className="mt-2 flex items-center gap-2 text-2xl font-black">
                  دیدگاه‌ها
                  <span className="text-sm font-medium text-faint">({comments.length.toLocaleString("fa-IR")})</span>
                </h2>
              </div>
              <MessageCircle className="size-5 text-faint" strokeWidth={1.4} aria-hidden="true" />
            </div>

            <div className="rounded-[1.5rem] bg-white/[0.035] p-5 ring-1 ring-white/[0.06] sm:p-6">
              {user ? (
                <NewsCommentForm storySlug={story.slug} />
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-7 text-muted">برای پیوستن به گفت‌وگو وارد حساب خود شوید.</p>
                  <Link href={`/login?next=${encodeURIComponent(`/news/${story.slug}#comments`)}`} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                    ورود و نوشتن دیدگاه
                    <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 divide-y divide-white/[0.07]">
              {comments.map((comment) => (
                <article key={comment.id} id={`comment-${comment.id}`} className="flex gap-3 py-6 first:pt-0">
                  <Avatar src={comment.author.avatar} alt={comment.author.displayName} fallback={comment.author.displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/users/${comment.author.username}`} className="text-sm font-semibold hover:text-primary-strong">{comment.author.displayName}</Link>
                      <span className="text-[10px] text-faint">{formatRelativeDate(comment.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-8 text-slate-300" dir="auto">{comment.content}</p>
                  </div>
                </article>
              ))}
              {!comments.length ? <p className="py-8 text-center text-sm text-faint">هنوز دیدگاهی ثبت نشده؛ اولین نفر باشید.</p> : null}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.06]">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-primary-strong">در این مطلب</p>
            <nav className="mt-4 space-y-1" aria-label="فهرست مطلب">
              {story.sections.map((section, index) => (
                <a key={section.heading} href={`#section-${index + 1}`} className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-xs leading-6 text-muted transition-colors duration-500 hover:bg-white/[0.05] hover:text-white">
                  <span className={`mt-2 size-1.5 shrink-0 rounded-full ${story.accent}`} />
                  {section.heading}
                </a>
              ))}
              <a href="#comments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-muted transition-colors duration-500 hover:bg-white/[0.05] hover:text-white">
                <MessageCircle className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                گفت‌وگو درباره خبر
              </a>
            </nav>
          </div>

          <div className="rounded-[1.5rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.06]">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-primary-strong" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="text-sm font-bold">پیوندهای مرتبط</h2>
            </div>
            <div className="mt-4 space-y-2">
              <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-3 text-xs text-muted transition-colors duration-500 hover:text-white">
                اتاق خبر {story.source}
                <ArrowUpLeft className="size-3.5 transition-transform duration-500 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.4} aria-hidden="true" />
              </a>
              <Link href="/#latest-news" className="group flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-3 text-xs text-muted transition-colors duration-500 hover:text-white">
                همه خبرهای ProAI
                <ArrowLeft className="size-3.5 transition-transform duration-500 group-hover:-translate-x-0.5" strokeWidth={1.4} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className={`overflow-hidden rounded-[1.5rem] p-6 text-[#07110d] ${story.accent}`}>
            <Mail className="size-5" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-8 text-xl font-black leading-8">از سیگنال‌های مهم عقب نمانید.</h2>
            <p className="mt-3 text-xs leading-6 text-black/60">گزیده خبر و تحلیل کاربردی برای سازندگان هوش مصنوعی.</p>
            <Link href="/register" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#081a12] px-4 py-2.5 text-xs font-semibold text-white">
              عضویت در ProAI
              <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-24 border-t border-white/[0.07] pt-10" aria-labelledby="related-news">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary-strong">KEEP READING</p>
            <h2 id="related-news" className="mt-2 text-2xl font-black">برای مطالعه بعدی</h2>
          </div>
          <Link href="/#latest-news" className="text-xs text-muted transition-colors duration-500 hover:text-white">مشاهده همه</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {relatedStories.map((item) => (
            <Link key={item.slug} href={`/news/${item.slug}`} className="group overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/[0.06] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0f17]">
                <Image src={item.coverImage} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-75 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
                <div className={`absolute inset-x-0 bottom-0 h-1 ${item.accent}`} />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-semibold text-primary-strong">{item.category} · {item.source}</p>
                <h3 className="pretty-text mt-3 text-base font-bold leading-7">{item.title}</h3>
                <p className="mt-3 text-[10px] text-faint">{item.readTime} مطالعه</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
