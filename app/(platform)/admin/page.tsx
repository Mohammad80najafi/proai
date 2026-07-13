import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpLeft,
  BookOpenCheck,
  CircleGauge,
  Clock3,
  FileWarning,
  Flag,
  Newspaper,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import {
  ContentStatusControl,
  ReportResolutionControl,
  UserRoleControl,
  UserStatusControl,
} from "@/features/admin/admin-controls";
import { DeleteNewsButton } from "@/features/admin/news-editor-form";
import {
  getAdminContent,
  getAdminNews,
  getAdminOverview,
  getAdminReports,
  getAdminUsers,
} from "@/features/admin/data";
import type {
  AdminAuditRow,
  AdminMetric,
  AdminReportRow,
  AdminSection,
  AdminUserRow,
} from "@/features/admin/types";
import { requireUser } from "@/lib/auth/dal";
import { formatDate, formatNumber, formatRelativeDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "مرکز مدیریت",
  description: "کنترل کاربران، محتوا و گزارش‌های جامعه پروای‌آی",
};

type SearchParams = Promise<{
  view?: string;
  q?: string;
  status?: string;
  type?: string;
}>;

const sections: Array<{
  key: AdminSection;
  label: string;
  description: string;
  icon: typeof CircleGauge;
}> = [
  { key: "overview", label: "نمای عملیات", description: "نبض سامانه", icon: CircleGauge },
  { key: "users", label: "کاربران", description: "دسترسی و وضعیت", icon: UsersRound },
  { key: "content", label: "محتوا", description: "کنترل انتشار", icon: BookOpenCheck },
  { key: "news", label: "اخبار", description: "میز تحریریه", icon: Newspaper },
  { key: "reports", label: "گزارش‌ها", description: "صف رسیدگی", icon: Flag },
];

const accountStatusLabels = {
  active: "فعال",
  suspended: "تعلیق‌شده",
  deleted: "حذف‌شده",
} as const;
const moderationStatusLabels = {
  visible: "قابل نمایش",
  "under-review": "در حال بررسی",
  removed: "حذف از نمایش",
} as const;
const reportStatusLabels = {
  open: "باز",
  reviewing: "در حال رسیدگی",
  resolved: "رسیدگی‌شده",
  dismissed: "ردشده",
} as const;
const reportReasonLabels: Record<string, string> = {
  spam: "هرزنامه",
  harassment: "آزار",
  hate: "نفرت‌پراکنی",
  sexual: "محتوای جنسی",
  violence: "خشونت",
  copyright: "حق نشر",
  misinformation: "اطلاعات نادرست",
  other: "سایر",
};
const auditActionLabels: Record<string, string> = {
  "user-status-updated": "وضعیت کاربر تغییر کرد",
  "user-role-updated": "سطح دسترسی تغییر کرد",
  "content-status-updated": "وضعیت محتوا تغییر کرد",
  "report-resolved": "گزارش رسیدگی شد",
  "report-dismissed": "گزارش رد شد",
  "news-created": "خبر ساخته شد",
  "news-updated": "خبر ویرایش شد",
  "news-deleted": "خبر حذف شد",
};

function sectionFrom(value?: string): AdminSection {
  return sections.some((section) => section.key === value)
    ? (value as AdminSection)
    : "overview";
}

function statusVariant(status: string): BadgeVariant {
  if (["active", "visible", "resolved"].includes(status)) return "green";
  if (["suspended", "removed", "dismissed"].includes(status)) return "red";
  if (["under-review", "reviewing", "open"].includes(status)) return "orange";
  return "neutral";
}

function AdminSectionNav({ active }: { active: AdminSection }) {
  return (
    <nav aria-label="بخش‌های مدیریت" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {sections.map((section) => {
        const Icon = section.icon;
        const selected = active === section.key;
        return (
          <Link
            key={section.key}
            href={section.key === "overview" ? "/admin" : `/admin?view=${section.key}`}
            aria-current={selected ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-2xl border p-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400/70 ${
              selected
                ? "border-orange-400/25 bg-orange-400/[0.075] text-white"
                : "border-white/[0.07] bg-white/[0.025] text-slate-500 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <span className={`grid size-10 place-items-center rounded-xl ${selected ? "bg-orange-400/15 text-orange-200" : "bg-white/[0.04] text-slate-600 group-hover:text-slate-400"}`}>
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span>
              <strong className="block text-sm font-semibold">{section.label}</strong>
              <span className="mt-1 block text-[10px] text-slate-600">{section.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MetricStrip({ metrics }: { metrics: AdminMetric[] }) {
  const toneClasses: Record<AdminMetric["tone"], string> = {
    neutral: "text-white",
    good: "text-emerald-200",
    warning: "text-orange-200",
    danger: "text-red-200",
  };
  return (
    <div className="grid divide-y divide-white/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:divide-x-reverse xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.key} className="px-5 py-5 sm:px-6">
          <p className="text-[11px] font-medium text-slate-600">{metric.label}</p>
          <strong className={`mt-3 block text-3xl font-black tracking-tight ${toneClasses[metric.tone]}`}>
            {formatNumber(metric.value)}
          </strong>
          <p className="mt-2 text-[10px] text-slate-600">{metric.helper}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ activity }: { activity: Awaited<ReturnType<typeof getAdminOverview>>["activity"] }) {
  const maximum = Math.max(1, ...activity.map((point) => point.total));
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">ریتم چهارده روز اخیر</h2>
          <p className="mt-1 text-[11px] text-slate-600">عضویت‌های تازه و محتوای ساخته‌شده، روزبه‌روز</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-indigo-400" />کاربر</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-orange-300" />محتوا</span>
        </div>
      </div>
      <div className="grid h-44 grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1.5 sm:gap-2" role="img" aria-label="نمودار فعالیت چهارده روز اخیر">
        {activity.map((point, index) => (
          <div key={point.key} className="group flex h-full min-w-0 flex-col justify-end gap-2">
            <div className="relative flex min-h-2 flex-1 items-end overflow-hidden rounded-md bg-white/[0.025]">
              <div
                className="w-full rounded-md bg-gradient-to-t from-indigo-500/65 via-indigo-400/75 to-orange-300/90 transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max(point.total ? 10 : 3, (point.total / maximum) * 100)}%` }}
                title={`${point.users.toLocaleString("fa-IR")} کاربر، ${point.content.toLocaleString("fa-IR")} محتوا`}
              />
            </div>
            <span className={`truncate text-center text-[9px] ${index % 2 === 0 ? "text-slate-600" : "text-slate-700"}`}>
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserIdentity({ user }: { user: AdminUserRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={user.avatar} fallback={user.displayName} alt={user.displayName} size="sm" />
      <div className="min-w-0">
        <Link href={`/users/${user.username}`} className="block truncate text-sm font-semibold text-slate-100 hover:text-indigo-200">
          {user.displayName}
        </Link>
        <span className="mt-1 block truncate text-[10px] text-slate-600" dir="ltr">@{user.username}</span>
      </div>
    </div>
  );
}

function AuditTrail({ rows }: { rows: AdminAuditRow[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">ردپای تصمیم‌ها</h2>
          <p className="mt-1 text-[11px] text-slate-600">هر تغییر مدیریتی در این دفتر ثبت می‌شود.</p>
        </div>
        <ShieldCheck className="size-5 text-orange-300" aria-hidden />
      </div>
      <div className="relative space-y-4 before:absolute before:bottom-2 before:start-[5px] before:top-2 before:w-px before:bg-white/[0.08]">
        {rows.map((row) => (
          <div key={row.id} className="relative ps-6">
            <span className="absolute start-0 top-1.5 size-[11px] rounded-full border-2 border-[#0d121e] bg-orange-300" />
            <p className="text-xs text-slate-300">{auditActionLabels[row.action] ?? row.action}</p>
            <p className="mt-1 text-[10px] text-slate-600">{row.moderatorName} · {formatRelativeDate(row.createdAt)}</p>
            {row.note ? <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{row.note}</p> : null}
          </div>
        ))}
        {!rows.length ? <p className="ps-6 text-xs text-slate-600">هنوز تصمیم مدیریتی ثبت نشده است.</p> : null}
      </div>
    </Card>
  );
}

function OverviewView({ data }: { data: Awaited<ReturnType<typeof getAdminOverview>> }) {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-orange-400/15 bg-[linear-gradient(135deg,rgba(249,115,22,0.055),transparent_36%),#0d121e]" elevated>
        <MetricStrip metrics={data.metrics} />
      </Card>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <Card className="p-5 sm:p-6"><ActivityChart activity={data.activity} /></Card>
        <AuditTrail rows={data.recentActions} />
      </div>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold">اعضای تازه</h2>
            <p className="mt-1 text-[11px] text-slate-600">آخرین حساب‌های ساخته‌شده در جامعه</p>
          </div>
          <Link href="/admin?view=users" className="inline-flex items-center gap-1.5 text-xs text-orange-200 hover:text-orange-100">
            مدیریت کاربران <ArrowUpLeft className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {data.recentUsers.map((user) => (
            <div key={user.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
              <UserIdentity user={user} />
              <Badge variant={statusVariant(user.accountStatus)} dot>{accountStatusLabels[user.accountStatus]}</Badge>
              <span className="text-[10px] text-slate-600">عضویت {formatRelativeDate(user.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FilterBar({
  view,
  query,
  status,
  type,
}: {
  view: Exclude<AdminSection, "overview">;
  query?: string;
  status?: string;
  type?: string;
}) {
  return (
    <form method="get" className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:grid-cols-[minmax(220px,1fr)_170px_150px_auto] sm:items-end">
      <input type="hidden" name="view" value={view} />
      <Input name="q" defaultValue={query} placeholder={view === "users" ? "نام یا نام کاربری" : view === "reports" ? "متن توضیحات گزارش" : view === "news" ? "عنوان، منبع یا دسته‌بندی" : "عنوان یا شناسه محتوا"} startIcon={<Search />} label="جست‌وجو" />
      <Select name="status" defaultValue={status ?? ""} label="وضعیت">
        <option value="">همه وضعیت‌ها</option>
        {view === "users" ? (
          <><option value="active">فعال</option><option value="suspended">تعلیق‌شده</option><option value="deleted">حذف‌شده</option></>
        ) : view === "content" ? (
          <><option value="visible">قابل نمایش</option><option value="under-review">در حال بررسی</option><option value="removed">حذف از نمایش</option></>
        ) : view === "news" ? (
          <><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option></>
        ) : (
          <><option value="open">باز</option><option value="reviewing">در حال رسیدگی</option><option value="resolved">رسیدگی‌شده</option><option value="dismissed">ردشده</option></>
        )}
      </Select>
      {view === "content" ? (
        <Select name="type" defaultValue={type ?? ""} label="نوع محتوا"><option value="">همه</option><option value="Prompt">پرامپت</option><option value="Skill">مهارت</option></Select>
      ) : <span className="hidden sm:block" />}
      <Button type="submit" variant="outline"><Search className="size-4" aria-hidden />اعمال فیلتر</Button>
    </form>
  );
}

function UsersView({ data, currentAdminId, params }: { data: Awaited<ReturnType<typeof getAdminUsers>>; currentAdminId: string; params: { q?: string; status?: string } }) {
  return (
    <div className="space-y-4">
      <FilterBar view="users" query={params.q} status={params.status} />
      <div className="flex items-center justify-between px-1 text-xs text-slate-600"><span>{formatNumber(data.total)} کاربر پیدا شد</span><span>حداکثر ۵۰ نتیجه تازه</span></div>
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(220px,1.4fr)_120px_150px_190px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold text-slate-600 lg:grid">
          <span>کاربر</span><span>وضعیت</span><span>سطح دسترسی</span><span>عملیات</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {data.users.map((user) => {
            const isCurrentAdmin = user.id === currentAdminId;
            return (
              <div key={user.id} className="grid gap-4 px-5 py-4 [content-visibility:auto] [contain-intrinsic-size:0_96px] lg:grid-cols-[minmax(220px,1.4fr)_120px_150px_190px] lg:items-center">
                <div><UserIdentity user={user} /><p className="mt-2 text-[10px] text-slate-600">{formatNumber(user.reputationScore)} اعتبار · {formatDate(user.createdAt)}</p></div>
                <Badge variant={statusVariant(user.accountStatus)} dot className="w-fit">{accountStatusLabels[user.accountStatus]}</Badge>
                <UserRoleControl userId={user.id} roles={user.roles} disabled={isCurrentAdmin || user.accountStatus === "deleted"} />
                <div className="flex flex-wrap items-center gap-2"><UserStatusControl userId={user.id} status={user.accountStatus} disabled={isCurrentAdmin} />{isCurrentAdmin ? <span className="text-[10px] text-orange-200">حساب جاری</span> : null}</div>
              </div>
            );
          })}
          {!data.users.length ? <p className="p-8 text-center text-sm text-slate-600">کاربری با این فیلتر پیدا نشد.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function ContentView({ data, params }: { data: Awaited<ReturnType<typeof getAdminContent>>; params: { q?: string; status?: string; type?: string } }) {
  return (
    <div className="space-y-4">
      <FilterBar view="content" query={params.q} status={params.status} type={params.type} />
      <div className="px-1 text-xs text-slate-600">{formatNumber(data.total)} محتوا پیدا شد</div>
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(260px,1.5fr)_130px_120px_180px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold text-slate-600 lg:grid">
          <span>محتوا</span><span>سازنده</span><span>سیگنال جامعه</span><span>وضعیت نظارت</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {data.content.map((item) => (
            <div key={`${item.type}-${item.id}`} className="grid gap-4 px-5 py-4 [content-visibility:auto] [contain-intrinsic-size:0_92px] lg:grid-cols-[minmax(260px,1.5fr)_130px_120px_180px] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><Badge variant={item.type === "Prompt" ? "indigo" : "blue"}>{item.type === "Prompt" ? "پرامپت" : "مهارت"}</Badge><Badge variant={statusVariant(item.moderationStatus)} dot>{moderationStatusLabels[item.moderationStatus]}</Badge></div>
                {item.slug ? <Link href={`/${item.type === "Prompt" ? "prompts" : "skills"}/${item.slug}`} className="mt-2 block truncate text-sm font-semibold hover:text-indigo-200">{item.title}</Link> : <span className="mt-2 block truncate text-sm font-semibold text-slate-300">{item.title}</span>}
                <p className="mt-1 text-[10px] text-slate-600">ساخته‌شده {formatRelativeDate(item.createdAt)} · {item.visibility}</p>
              </div>
              <Link href={`/users/${item.authorUsername}`} className="truncate text-xs text-slate-400 hover:text-white">{item.authorName}</Link>
              <div className="text-[10px] leading-6 text-slate-600"><span>{formatNumber(item.likes)} پسند</span><br /><span>{formatNumber(item.comments)} گفت‌وگو</span></div>
              <ContentStatusControl targetId={item.id} targetType={item.type} status={item.moderationStatus} />
            </div>
          ))}
          {!data.content.length ? <p className="p-8 text-center text-sm text-slate-600">محتوایی با این فیلتر پیدا نشد.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function NewsView({ data, params }: { data: Awaited<ReturnType<typeof getAdminNews>>; params: { q?: string; status?: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><FilterBar view="news" query={params.q} status={params.status} /></div>
        <ButtonLink href="/admin/news/new" className="sm:mb-3"><Plus className="size-4" />خبر تازه</ButtonLink>
      </div>
      <div className="flex items-center justify-between px-1 text-xs text-slate-600"><span>{formatNumber(data.total)} خبر در میز تحریریه</span><span>پیش‌نویس‌ها فقط برای مدیران دیده می‌شوند</span></div>
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[96px_minmax(260px,1.5fr)_120px_210px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold text-slate-600 lg:grid">
          <span>جلد</span><span>خبر</span><span>انتشار</span><span>عملیات</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {data.news.map((story) => (
            <div key={story.slug} className="grid gap-4 px-5 py-4 [content-visibility:auto] [contain-intrinsic-size:0_104px] lg:grid-cols-[96px_minmax(260px,1.5fr)_120px_210px] lg:items-center">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-black/20">
                <Image src={story.coverImage} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Badge variant={story.status === "published" ? "green" : "orange"} dot>{story.status === "published" ? "منتشرشده" : "پیش‌نویس"}</Badge>{story.featured ? <Badge variant="indigo">داستان اصلی</Badge> : null}{!story.managed ? <Badge>خبر اولیه</Badge> : null}</div>
                <Link href={`/news/${story.slug}`} className="mt-2 block truncate text-sm font-semibold hover:text-indigo-200">{story.title}</Link>
                <p className="mt-1 text-[10px] text-slate-600">{story.category} · {story.source}</p>
              </div>
              <div className="text-[10px] leading-6 text-slate-500">{story.dateFull}<br /><span dir="ltr">/{story.slug}</span></div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonLink href={`/admin/news/${story.slug}/edit`} variant="outline" size="sm"><Pencil className="size-3.5" />ویرایش</ButtonLink>
                <DeleteNewsButton slug={story.slug} title={story.title} />
              </div>
            </div>
          ))}
          {!data.news.length ? <p className="p-8 text-center text-sm text-slate-600">خبری با این فیلتر پیدا نشد.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function ReportCard({ report }: { report: AdminReportRow }) {
  const closed = report.status === "resolved" || report.status === "dismissed";
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#0d121e] p-5 [content-visibility:auto] [contain-intrinsic-size:0_220px] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(report.status)} dot>{reportStatusLabels[report.status]}</Badge><Badge>{reportReasonLabels[report.reason] ?? report.reason}</Badge><span className="text-[10px] text-slate-600">{formatRelativeDate(report.createdAt)}</span></div>
          <h2 className="mt-3 text-sm font-semibold text-white">{report.targetLabel}</h2>
          <p className="mt-1 text-[10px] text-slate-600">گزارش درباره {report.targetModel} · توسط @{report.reporterUsername}</p>
        </div>
        <FileWarning className="size-5 text-orange-300" aria-hidden />
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-black/15 p-3 text-xs leading-6 text-slate-400">{report.details || "گزارش‌دهنده توضیح تکمیلی ثبت نکرده است."}</p>
      {closed ? (
        <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden /><span>{report.resolution || "این گزارش بسته شده است."}</span></div>
      ) : (
        <div className="mt-4 border-t border-white/[0.06] pt-4"><ReportResolutionControl reportId={report.id} /></div>
      )}
    </article>
  );
}

function ReportsView({ data, params }: { data: Awaited<ReturnType<typeof getAdminReports>>; params: { q?: string; status?: string } }) {
  return (
    <div className="space-y-4">
      <FilterBar view="reports" query={params.q} status={params.status} />
      <div className="px-1 text-xs text-slate-600">{formatNumber(data.total)} گزارش در این نما</div>
      <div className="grid gap-4 xl:grid-cols-2">{data.reports.map((report) => <ReportCard key={report.id} report={report} />)}</div>
      {!data.reports.length ? <Card className="p-10 text-center"><ShieldCheck className="mx-auto size-8 text-emerald-300" /><p className="mt-3 text-sm text-slate-400">صف گزارش‌ها در این وضعیت خالی است.</p></Card> : null}
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireUser();
  if (!currentUser.roles.includes("admin")) redirect("/");
  const view = sectionFrom(params.view);
  const data = view === "overview"
    ? await getAdminOverview()
    : view === "users"
      ? await getAdminUsers({ query: params.q, status: params.status })
      : view === "content"
        ? await getAdminContent({ query: params.q, status: params.status, type: params.type })
        : view === "news"
          ? await getAdminNews({ query: params.q, status: params.status })
          : await getAdminReports({ query: params.q, status: params.status });
  const activeSection = sections.find((section) => section.key === view) ?? sections[0];
  const ActiveIcon = activeSection.icon;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[26px] border border-orange-400/15 bg-[radial-gradient(circle_at_8%_15%,rgba(249,115,22,.13),transparent_28%),linear-gradient(135deg,#111724,#0b0f18)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.2)] sm:p-8">
        <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-orange-300 via-orange-500 to-transparent" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2"><Badge variant="orange" dot>دسترسی مدیر</Badge><span className="flex items-center gap-1.5 text-[10px] text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,.08)]" />سامانه در دسترس است</span></div>
            <p className="text-[11px] font-semibold tracking-wide text-orange-200/70">PROAI / OPERATIONS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">مرکز مدیریت جامعه</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">یک نمای عملیاتی برای مراقبت از کاربران، کیفیت محتوا و تصمیم‌های نظارتی.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/15 p-3">
            <Avatar src={currentUser.avatar} fallback={currentUser.displayName} alt={currentUser.displayName} size="sm" status="online" />
            <div><p className="text-xs font-semibold text-slate-200">{currentUser.displayName}</p><p className="mt-1 text-[10px] text-slate-600" dir="ltr">@{currentUser.username}</p></div>
          </div>
        </div>
      </header>

      <AdminSectionNav active={view} />

      <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
        <span className="grid size-9 place-items-center rounded-xl bg-orange-400/10 text-orange-200"><ActiveIcon className="size-4" aria-hidden /></span>
        <div><h2 className="text-sm font-semibold text-white">{activeSection.label}</h2><p className="mt-0.5 text-[10px] text-slate-600">{activeSection.description}</p></div>
        <div className="ms-auto flex items-center gap-1.5 text-[10px] text-slate-700"><Clock3 className="size-3.5" aria-hidden />به‌روزرسانی زنده</div>
      </div>

      {view === "overview" ? <OverviewView data={data as Awaited<ReturnType<typeof getAdminOverview>>} /> : null}
      {view === "users" ? <UsersView data={data as Awaited<ReturnType<typeof getAdminUsers>>} currentAdminId={currentUser.id} params={{ q: params.q, status: params.status }} /> : null}
      {view === "content" ? <ContentView data={data as Awaited<ReturnType<typeof getAdminContent>>} params={{ q: params.q, status: params.status, type: params.type }} /> : null}
      {view === "news" ? <NewsView data={data as Awaited<ReturnType<typeof getAdminNews>>} params={{ q: params.q, status: params.status }} /> : null}
      {view === "reports" ? <ReportsView data={data as Awaited<ReturnType<typeof getAdminReports>>} params={{ q: params.q, status: params.status }} /> : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[10px] text-slate-700">
        <span className="flex items-center gap-1.5"><Activity className="size-3.5" aria-hidden />تمام عملیات حساس دوباره در سرور احراز هویت می‌شوند.</span>
        <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" aria-hidden />ProAI Community Operations</span>
      </footer>
    </div>
  );
}
