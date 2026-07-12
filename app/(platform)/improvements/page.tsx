import Link from "next/link";
import { AlertTriangle, ArrowLeft, GitPullRequestArrow, MessageSquareText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listImprovements } from "@/features/improvements/data";
import { requireUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

const statuses: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: "پیش‌نویس", variant: "neutral" }, open: { label: "باز", variant: "blue" },
  "changes-requested": { label: "نیازمند تغییر", variant: "orange" }, accepted: { label: "پذیرفته‌شده", variant: "green" },
  rejected: { label: "ردشده", variant: "red" }, closed: { label: "بسته", variant: "neutral" },
};

export const metadata = { title: "پیشنهادهای بهبود" };

export default async function ImprovementsPage() {
  const user = await requireUser();
  const requests = await listImprovements(user).catch(() => []);
  return <div className="space-y-7"><PageHeader eyebrow="همکاری نسخه‌پذیر" title="پیشنهادهای بهبود" description="پیشنهادها، گفت‌وگوها و تصمیم‌های مربوط به ارتقای محتوای اصلی را در یک مسیر شفاف مدیریت کنید." />{requests.length ? <div className="space-y-3">{requests.map((request) => { const badge = statuses[request.status] ?? statuses.closed; return <Link key={request.id} href={`/improvements/${request.id}`} className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"><Card interactive className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><GitPullRequestArrow className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold">{request.title}</h2><Badge variant={badge.variant}>{badge.label}</Badge>{request.hasBaseConflict ? <Badge variant="red"><AlertTriangle className="size-3" />تداخل نسخه</Badge> : null}</div><p className="mt-1 truncate text-sm text-muted">{request.targetTitle} · {request.summary}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-faint"><span className="flex items-center gap-1.5"><Avatar src={request.proposer.avatar} fallback={request.proposer.displayName} alt="" size="xs" />{request.proposer.displayName}</span><span>{request.changedPaths.length.toLocaleString("fa-IR")} بخش تغییرکرده</span><span>{formatRelativeDate(request.lastActivityAt)}</span></div></div><ArrowLeft className="size-4 shrink-0 text-faint" /></div></Card></Link>; })}</div> : <Card className="grid min-h-64 place-items-center p-8 text-center"><div><MessageSquareText className="mx-auto size-8 text-faint" /><h2 className="mt-4 font-semibold">هنوز پیشنهادی ندارید</h2><p className="mt-2 text-sm text-muted">پس از ایجاد یا دریافت یک پیشنهاد بهبود، اینجا نمایش داده می‌شود.</p></div></Card>}</div>;
}
