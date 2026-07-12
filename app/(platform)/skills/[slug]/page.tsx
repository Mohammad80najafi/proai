import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Boxes, CheckCircle2, GitPullRequestArrow, History, MessageSquare, Network, Star, Wrench } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { CommentForm } from "@/features/content/comment-form";
import { ContentActions } from "@/features/content/content-actions";
import { ContentImageGallery } from "@/features/content/content-image-gallery";
import { CopyButton } from "@/features/content/copy-button";
import { getComments, getSkillBySlug } from "@/features/content/data";
import { getOptionalUser } from "@/lib/auth/dal";
import { formatDate, formatRelativeDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug).catch(() => null);
  return skill ? { title: skill.title, description: skill.description } : { title: "مهارت" };
}

export default async function SkillDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getOptionalUser().catch(() => null);
  const skill = await getSkillBySlug(slug, user?.id ?? null).catch(() => null);
  if (!skill) notFound();
  const comments = await getComments("Skill", skill.id, user?.id ?? null).catch(() => []);

  return (
    <div className="space-y-7">
      <Link href="/explore?type=skills" className="inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-white">
        <ArrowRight className="size-4" aria-hidden />
        بازگشت به کتابخانه مهارت‌ها
      </Link>

      <section className="relative overflow-hidden rounded-[30px] border border-white/[0.075] bg-[#0d0b15] p-1 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="relative overflow-hidden rounded-[26px] border border-white/[0.045] bg-[radial-gradient(circle_at_88%_15%,rgba(168,85,247,0.16),transparent_35%),linear-gradient(135deg,#151124,#0a0a12)] px-6 py-8 sm:px-9 sm:py-10">
          <Boxes className="pointer-events-none absolute -left-5 -top-8 size-40 text-white/[0.022]" aria-hidden />
          <div className="relative max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="indigo">مهارت تخصصی</Badge>
              <Badge>نسخه {skill.versions[0]?.versionLabel ?? skill.version.toLocaleString("fa-IR")}</Badge>
              {skill.viewer.isOwner ? <Badge variant="green">مالک محتوا</Badge> : null}
            </div>
            <h1 className="max-w-3xl text-balance text-3xl font-black leading-[1.45] text-white sm:text-5xl">{skill.title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">{skill.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
              <Link href={`/users/${skill.author.username}`} className="flex items-center gap-3">
                <Avatar src={skill.author.avatar} fallback={skill.author.displayName} alt={skill.author.displayName} size="sm" />
                <span><span className="block text-xs font-semibold text-slate-200">{skill.author.displayName}</span><span className="mt-0.5 block text-[10px] text-faint" dir="ltr">@{skill.author.username}</span></span>
              </Link>
              <span className="text-[11px] text-faint">به‌روزرسانی {formatRelativeDate(skill.updatedAt)}</span>
              <div className="sm:ms-auto"><CopyButton value={skill.instructions} label="کپی دستورالعمل" /></div>
            </div>
          </div>
        </div>
      </section>

      <ContentImageGallery images={skill.images} title={skill.title} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4"><BookOpen className="size-4 text-primary" /><h2 className="font-semibold">دستورالعمل</h2></div><div className="p-5 sm:p-7"><Markdown>{skill.instructions}</Markdown></div></Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /><h2 className="font-semibold">دانش مورد نیاز</h2></div><ul className="space-y-2.5">{skill.requiredKnowledge.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-muted"><span className="mt-2 size-1.5 rounded-full bg-success" />{item}</li>)}</ul></Card>
            <Card className="p-5"><div className="mb-4 flex items-center gap-2"><Wrench className="size-4 text-warning" /><h2 className="font-semibold">ابزارها</h2></div><div className="flex flex-wrap gap-2">{skill.tools.map((tool) => <Badge key={tool}>{tool}</Badge>)}</div></Card>
          </div>

          <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Network className="size-4 text-primary" /><h2 className="font-semibold">گردش کار</h2></div><ol className="space-y-4">{skill.workflow.map((section, index) => <li key={`${section.title}-${index}`} className="grid grid-cols-[34px_1fr] gap-3"><span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary-strong">{(index + 1).toLocaleString("fa-IR")}</span><div><h3 className="text-sm font-semibold">{section.title}</h3>{section.items.map((item) => <p key={item} className="mt-1 text-sm leading-7 text-muted">{item}</p>)}</div></li>)}</ol></Card>

          {skill.dependencies.length ? <Card className="p-5 sm:p-6"><h2 className="mb-4 font-semibold">وابستگی‌ها</h2><div className="space-y-2">{skill.dependencies.map((dependency) => <div key={`${dependency.name}-${dependency.version}`} className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3"><span className="text-sm">{dependency.name}</span><code className="text-[11px] text-primary-strong" dir="ltr">{dependency.version}</code></div>)}</div></Card> : null}

          <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><History className="size-4 text-primary" /><h2 className="font-semibold">تاریخچه نسخه‌ها</h2></div><div className="space-y-4">{skill.versions.map((version) => <div key={version.id} className="flex items-start justify-between gap-4 border-b border-white/[0.055] pb-4 last:border-0 last:pb-0"><div><strong className="text-sm">نسخه {version.versionLabel}</strong><p className="mt-1 text-xs leading-6 text-muted">{version.changes}</p></div><span className="shrink-0 text-[10px] text-faint">{formatDate(version.createdAt)}</span></div>)}</div></Card>

          <Card id="comments" className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><MessageSquare className="size-4 text-primary" /><h2 className="font-semibold">گفت‌وگو ({comments.length.toLocaleString("fa-IR")})</h2></div>{user ? <CommentForm targetType="Skill" targetId={skill.id} /> : <p className="rounded-xl bg-white/[0.025] p-4 text-sm text-muted">برای نوشتن دیدگاه <Link href={`/login?next=/skills/${slug}`} className="text-primary-strong">وارد شوید</Link>.</p>}<div className="mt-6 divide-y divide-white/[0.06]">{comments.map((comment) => <article key={comment.id} className="flex gap-3 py-5"><Avatar src={comment.author.avatar} fallback={comment.author.displayName} alt={comment.author.displayName} size="sm" /><div><div className="flex items-center gap-2"><Link href={`/users/${comment.author.username}`} className="text-sm font-semibold">{comment.author.displayName}</Link><span className="text-[10px] text-faint">{formatRelativeDate(comment.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">{comment.content}</p></div></article>)}{!comments.length ? <p className="py-5 text-center text-sm text-faint">هنوز دیدگاهی ثبت نشده است.</p> : null}</div></Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="p-5"><ContentActions targetType="Skill" targetId={skill.id} liked={skill.viewer.hasLiked} saved={skill.viewer.hasSaved} rating={skill.viewer.rating} likes={skill.stats.likes} saves={skill.stats.saves} improvements={skill.stats.forks} isOwner={skill.viewer.isOwner} /></Card>
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold text-faint">سازنده</p>
            <Link href={`/users/${skill.author.username}`} className="flex items-center gap-3"><Avatar src={skill.author.avatar} fallback={skill.author.displayName} alt={skill.author.displayName} /><div><p className="text-sm font-semibold">{skill.author.displayName}</p><p className="mt-1 text-[11px] text-faint" dir="ltr">@{skill.author.username}</p></div></Link>
            {skill.contributors.length ? <div className="mt-4 border-t border-white/[0.07] pt-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-faint">مشارکت‌کنندگان</p><div className="space-y-2">{skill.contributors.map((contributor) => <Link key={contributor.id} href={`/users/${contributor.username}`} className="flex items-center gap-2 rounded-lg p-1.5 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary/60"><Avatar src={contributor.avatar} fallback={contributor.displayName} alt="" size="xs" /><span className="text-xs font-medium text-slate-300">{contributor.displayName}</span><Badge variant="green" className="ms-auto">Contributor</Badge></Link>)}</div></div> : null}
          </Card>
          <Card className="space-y-3 p-5 text-xs text-muted"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Star className="size-4" />امتیاز جامعه</span><strong className="text-white">{skill.stats.ratingAverage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}</strong></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><GitPullRequestArrow className="size-4" />بهبودهای پذیرفته‌شده</span><strong className="text-white">{skill.stats.forks.toLocaleString("fa-IR")}</strong></div><div className="flex items-center justify-between"><span>ابزارها</span><strong className="text-white">{skill.tools.length.toLocaleString("fa-IR")}</strong></div><div className="flex items-center justify-between"><span>وابستگی‌ها</span><strong className="text-white">{skill.dependencies.length.toLocaleString("fa-IR")}</strong></div></Card>
        </aside>
      </div>
    </div>
  );
}
