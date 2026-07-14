import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Braces, CalendarDays, GitPullRequestArrow, History, MessageSquare, PencilLine, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { CommentForm } from "@/features/content/comment-form";
import { CommentThread } from "@/features/content/comment-thread";
import { ContentActions } from "@/features/content/content-actions";
import { ContentImageGallery } from "@/features/content/content-image-gallery";
import { CopyButton } from "@/features/content/copy-button";
import { getComments, getPromptBySlug } from "@/features/content/data";
import { getOptionalUser } from "@/lib/auth/dal";
import { formatDate, formatRelativeDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug).catch(() => null);
  return prompt ? { title: prompt.title, description: prompt.description } : { title: "پرامپت" };
}

export default async function PromptDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getOptionalUser().catch(() => null);
  const prompt = await getPromptBySlug(slug, user?.id ?? null).catch(() => null);
  if (!prompt) notFound();
  const comments = await getComments("Prompt", prompt.id, user?.id ?? null).catch(() => []);
  const commentCount = comments.reduce(
    (total, comment) => total + 1 + comment.replies.length,
    0,
  );

  return (
    <div className="space-y-7">
      <Link href="/explore?type=prompts" className="inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-white">
        <ArrowRight className="size-4" aria-hidden />
        بازگشت به کتابخانه پرامپت‌ها
      </Link>

      <section className="relative overflow-hidden rounded-[30px] border border-white/[0.075] bg-[#090d17] p-1 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="relative overflow-hidden rounded-[26px] border border-white/[0.045] bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.16),transparent_34%),linear-gradient(135deg,#101625,#090c14)] px-6 py-8 sm:px-9 sm:py-10">
          <Braces className="pointer-events-none absolute -left-5 -top-8 size-40 text-white/[0.022]" aria-hidden />
          <div className="relative max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="indigo">پرامپت · {prompt.category}</Badge>
              <Badge>نسخه {prompt.versions[0]?.versionLabel ?? prompt.version.toLocaleString("fa-IR")}</Badge>
              {prompt.viewer.isOwner ? <Badge variant="green">مالک محتوا</Badge> : null}
            </div>
            <h1 className="max-w-3xl text-balance text-3xl font-black leading-[1.45] text-white sm:text-5xl">{prompt.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">{prompt.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
              <Link href={`/users/${prompt.author.username}`} className="flex items-center gap-3">
                <Avatar src={prompt.author.avatar} fallback={prompt.author.displayName} alt={prompt.author.displayName} size="sm" />
                <span><span className="block text-xs font-semibold text-slate-200">{prompt.author.displayName}</span><span className="mt-0.5 block text-[10px] text-faint" dir="ltr">@{prompt.author.username}</span></span>
              </Link>
              <span className="text-[11px] text-faint">به‌روزرسانی {formatRelativeDate(prompt.updatedAt)}</span>
              <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
                {prompt.viewer.isOwner ? <ButtonLink href={`/prompts/${prompt.slug}/edit`} variant="secondary" size="sm"><PencilLine className="size-3.5" aria-hidden />به‌روزرسانی پرامپت</ButtonLink> : null}
                <CopyButton value={prompt.content} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContentImageGallery images={prompt.images} title={prompt.title} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4"><div><h2 className="font-semibold">متن پرامپت</h2><span className="mt-1 block text-[10px] text-faint">Markdown</span></div><CopyButton value={prompt.content} label="کپی پرامپت" /></div>
            <div className="p-5 sm:p-7"><Markdown>{prompt.content}</Markdown></div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2"><History className="size-4 text-primary" /><h2 className="font-semibold">تاریخچه نسخه‌ها</h2></div>
            <div className="space-y-0">
              {prompt.versions.map((version, index) => (
                <div key={version.id} className="relative grid grid-cols-[28px_1fr] gap-3 pb-5 last:pb-0">
                  <div className="relative flex justify-center"><span className={`mt-1.5 size-2.5 rounded-full ${index === 0 ? "bg-primary shadow-[0_0_0_5px_rgba(124,134,255,.12)]" : "bg-border-strong"}`} />{index < prompt.versions.length - 1 ? <span className="absolute bottom-0 top-4 w-px bg-border" /> : null}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">نسخه {version.versionLabel}</strong><span className="text-[11px] text-faint">{formatDate(version.createdAt)}</span></div><p className="mt-1 text-xs leading-6 text-muted">{version.changes}</p><p className="mt-1 text-[11px] text-faint">توسط {version.author.displayName}</p></div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="comments" className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2"><MessageSquare className="size-4 text-primary" /><h2 className="font-semibold">گفت‌وگو ({commentCount.toLocaleString("fa-IR")})</h2></div>
            {user ? <CommentForm targetType="Prompt" targetId={prompt.id} /> : <p className="rounded-xl bg-white/[0.025] p-4 text-sm text-muted">برای نوشتن دیدگاه <Link href={`/login?next=/prompts/${slug}`} className="text-primary-strong">وارد شوید</Link>.</p>}
            <div className="mt-6">
              <CommentThread comments={comments} targetType="Prompt" targetId={prompt.id} canReply={Boolean(user)} loginHref={`/login?next=/prompts/${slug}`} />
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="p-5"><ContentActions targetType="Prompt" targetId={prompt.id} liked={prompt.viewer.hasLiked} saved={prompt.viewer.hasSaved} rating={prompt.viewer.rating} likes={prompt.stats.likes} saves={prompt.stats.saves} improvements={prompt.stats.forks} isOwner={prompt.viewer.isOwner} /></Card>
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold text-faint">سازنده</p>
            <Link href={`/users/${prompt.author.username}`} className="flex items-center gap-3"><Avatar src={prompt.author.avatar} fallback={prompt.author.displayName} alt={prompt.author.displayName} /><div><p className="text-sm font-semibold">{prompt.author.displayName}</p><p className="mt-1 text-[11px] text-faint" dir="ltr">@{prompt.author.username}</p></div></Link>
            {prompt.contributors.length ? <div className="mt-4 border-t border-white/[0.07] pt-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-faint">مشارکت‌کنندگان</p><div className="space-y-2">{prompt.contributors.map((contributor) => <Link key={contributor.id} href={`/users/${contributor.username}`} className="flex items-center gap-2 rounded-lg p-1.5 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary/60"><Avatar src={contributor.avatar} fallback={contributor.displayName} alt="" size="xs" /><span className="text-xs font-medium text-slate-300">{contributor.displayName}</span><Badge variant="green" className="ms-auto">Contributor</Badge></Link>)}</div></div> : null}
          </Card>
          <Card className="space-y-3 p-5 text-xs text-muted"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Star className="size-4" />امتیاز جامعه</span><strong className="text-white">{prompt.stats.ratingAverage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}</strong></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><GitPullRequestArrow className="size-4" />بهبودهای پذیرفته‌شده</span><strong className="text-white">{prompt.stats.forks.toLocaleString("fa-IR")}</strong></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><CalendarDays className="size-4" />انتشار</span><strong className="text-white">{formatDate(prompt.createdAt)}</strong></div></Card>
        </aside>
      </div>
    </div>
  );
}
