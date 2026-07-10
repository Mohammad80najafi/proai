import { Search, UserRound } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { NewConversationForm } from "@/features/chat/new-conversation-form";
import { requireUser } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

type SearchParams = Promise<{ user?: string }>;
type TargetUser = { _id: unknown; username: string; displayName: string; avatar?: string | null; bio?: string };
export const metadata = { title: "گفت‌وگوی تازه" };

export default async function NewMessagePage({ searchParams }: { searchParams: SearchParams }) {
  const current = await requireUser();
  const query = await searchParams;
  let target: TargetUser | null = null;
  if (query.user) { await connectToDatabase(); target = await User.findOne({ username: query.user.toLowerCase(), accountStatus: "active", _id: { $ne: current.id } }).select("username displayName avatar bio").lean<TargetUser | null>(); }
  return <div className="mx-auto max-w-2xl space-y-7"><PageHeader eyebrow="پیام خصوصی" title="شروع گفت‌وگوی تازه" description="نام کاربری فرد مورد نظر را پیدا کنید. سیاست دریافت پیام هر کاربر رعایت می‌شود." breadcrumbs={[{ label: "پیام‌ها", href: "/messages" }, { label: "گفت‌وگوی تازه" }]} /><Card className="p-5 sm:p-6"><form action="/messages/new" method="get" className="flex gap-2"><div className="relative flex-1"><Search className="absolute inset-y-0 start-3 my-auto size-4 text-faint" /><input name="user" defaultValue={query.user} placeholder="نام کاربری بدون @" dir="ltr" className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#090e18] ps-10 pe-3 text-sm outline-none focus:border-primary/50" /></div><button type="submit" className="rounded-xl bg-primary px-5 text-sm font-semibold text-white">جست‌وجو</button></form></Card>{target ? <Card className="p-5"><div className="mb-5 flex items-center gap-3"><Avatar src={target.avatar} fallback={target.displayName} alt={target.displayName} /><div><h2 className="font-semibold">{target.displayName}</h2><p className="text-xs text-faint" dir="ltr">@{target.username}</p></div></div><p className="mb-5 text-sm leading-7 text-muted">{target.bio || "بدون توضیح پروفایل"}</p><NewConversationForm targetUserId={String(target._id)} /></Card> : query.user ? <Card className="p-8 text-center"><UserRound className="mx-auto size-7 text-faint" /><p className="mt-3 text-sm text-muted">کاربری با این نام پیدا نشد.</p></Card> : null}</div>;
}
