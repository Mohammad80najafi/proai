import { notFound } from "next/navigation";
import { AlertTriangle, ArrowUpLeft, GitPullRequestArrow, MessageSquareText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { CloseImprovementButton, ImprovementDecisionPanel, ImprovementMessageForm } from "@/features/improvements/improvement-controls";
import { getImprovementDetail } from "@/features/improvements/data";
import { OwnerProposalEditor } from "@/features/improvements/owner-proposal-editor";
import { SnapshotDiff } from "@/features/improvements/snapshot-diff";
import { requireUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };
const finalStatuses = ["accepted", "rejected", "closed"];

export default async function ImprovementDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const request = await getImprovementDetail(id, user);
  if (!request) notFound();
  const targetHref = `/${request.targetType === "Prompt" ? "prompts" : "skills"}/${request.targetSlug}`;
  const mainText = typeof request.proposedSnapshot.content === "string" ? request.proposedSnapshot.content : typeof request.proposedSnapshot.instructions === "string" ? request.proposedSnapshot.instructions : JSON.stringify(request.proposedSnapshot, null, 2);

  return (
    <div className="space-y-7">
      <PageHeader breadcrumbs={[{ label: "پیشنهادها", href: "/improvements" }, { label: request.title }]} eyebrow={<span className="inline-flex items-center gap-2"><GitPullRequestArrow className="size-4" />پیشنهاد برای {request.targetTitle}</span>} title={request.title} description={request.summary} meta={<><Badge variant={request.status === "accepted" ? "green" : request.status === "rejected" ? "red" : request.status === "changes-requested" ? "orange" : "blue"}>{request.status}</Badge><span className="text-xs text-faint">{request.changedPaths.length.toLocaleString("fa-IR")} بخش تغییرکرده</span>{request.hasBaseConflict ? <Badge variant="red"><AlertTriangle className="size-3" />تداخل نسخه پایه</Badge> : null}</>} actions={<ButtonLink href={targetHref} variant="outline" size="sm">مشاهده محتوای اصلی<ArrowUpLeft className="size-4" /></ButtonLink>} />
      {request.hasBaseConflict ? <div className="flex gap-3 rounded-2xl border border-danger/20 bg-danger/[0.07] p-4 text-sm leading-7 text-danger"><AlertTriangle className="mt-1 size-5 shrink-0" /><p>نسخه اصلی پس از شروع این پیشنهاد تغییر کرده است. پیشنهاد باید پیش از پذیرش با نسخه تازه هماهنگ شود.</p></div> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6"><SnapshotDiff base={request.baseSnapshot} proposed={request.proposedSnapshot} changedPaths={request.changedPaths} /></Card>
          <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4"><h2 className="font-semibold">پیش‌نمایش کامل پیشنهاد</h2><div className="flex flex-wrap gap-1.5">{request.changedPaths.map((path) => <Badge key={path}>{path}</Badge>)}</div></div><div className="p-5 sm:p-7"><Markdown>{mainText}</Markdown></div></Card>
          {request.isOwner && !finalStatuses.includes(request.status) ? <OwnerProposalEditor requestId={request.id} targetType={request.targetType} snapshot={request.proposedSnapshot} summary={request.summary} /> : null}
          <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><MessageSquareText className="size-4 text-primary" /><h2 className="font-semibold">گفت‌وگوی بررسی</h2></div><div className="space-y-4">{request.messages.map((message) => <article key={message.id} id={`message-${message.id}`} className={`flex gap-3 ${message.kind !== "message" ? "rounded-xl border border-white/[0.06] bg-white/[0.025] p-3" : ""}`}>{message.sender ? <Avatar src={message.sender.avatar} fallback={message.sender.displayName} alt={message.sender.displayName} size="sm" /> : <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><GitPullRequestArrow className="size-4" /></div>}<div><div className="flex items-center gap-2"><strong className="text-xs">{message.sender?.displayName ?? "رویداد سیستم"}</strong><span className="text-[10px] text-faint">{formatRelativeDate(message.createdAt)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-300">{message.content}</p></div></article>)}</div><div className="mt-6 border-t border-white/[0.06] pt-5"><ImprovementMessageForm requestId={request.id} disabled={finalStatuses.includes(request.status)} /></div></Card>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24">
          {request.isOwner ? <Card className="p-5"><h2 className="mb-4 font-semibold">تصمیم مالک</h2><ImprovementDecisionPanel requestId={request.id} status={request.status} versionBump={request.versionBump} customVersionLabel={request.customVersionLabel} /></Card> : null}
          {request.isProposer && !finalStatuses.includes(request.status) ? <Card className="p-4"><CloseImprovementButton requestId={request.id} /></Card> : null}
          <Card className="space-y-4 p-5"><div><p className="text-[10px] text-faint">مشارکت‌کننده</p><p className="mt-1 text-sm font-semibold">{request.proposer.displayName}</p></div><div><p className="text-[10px] text-faint">مالک</p><p className="mt-1 text-sm font-semibold">{request.owner.displayName}</p></div><div><p className="text-[10px] text-faint">آخرین فعالیت</p><p className="mt-1 text-sm">{formatRelativeDate(request.lastActivityAt)}</p></div></Card>
        </aside>
      </div>
    </div>
  );
}
