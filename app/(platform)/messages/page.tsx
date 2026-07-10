import Link from "next/link";
import { MessageCircle, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatClient } from "@/features/chat/chat-client";
import { getConversationList, getConversationMessages } from "@/features/chat/data";
import { requireUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

type SearchParams = Promise<{ conversation?: string }>;
export const metadata = { title: "پیام‌ها" };

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const query = await searchParams;
  const conversations = await getConversationList(user.id).catch(() => []);
  const selectedId = query.conversation ?? conversations[0]?.id;
  const selected = selectedId ? await getConversationMessages(selectedId, user.id).catch(() => null) : null;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="گفت‌وگوی خصوصی" title="پیام‌ها" description="با سازندگان و افرادی که دنبال می‌کنید در ارتباط بمانید." actions={<ButtonLink href="/messages/new" size="sm"><Plus className="size-4" />گفت‌وگوی تازه</ButtonLink>} />
      <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <Card className={`${selected ? "hidden xl:block" : "block"} overflow-hidden`}>
          <div className="border-b border-white/[0.06] p-3"><div className="relative"><Search className="absolute inset-y-0 start-3 my-auto size-4 text-faint" /><input type="search" placeholder="جست‌وجوی گفت‌وگو…" className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] ps-9 pe-3 text-xs outline-none focus:border-primary/40" /></div></div>
          <div className="scrollbar-subtle max-h-[calc(100vh-14rem)] overflow-y-auto p-2">{conversations.map((conversation) => <Link key={conversation.id} href={`/messages?conversation=${conversation.id}`} className={`flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04] ${selectedId === conversation.id ? "bg-primary-soft" : ""}`}><Avatar src={conversation.participant.avatar} fallback={conversation.participant.displayName} alt={conversation.participant.displayName} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="truncate text-sm font-semibold">{conversation.participant.displayName}</h2><span className="shrink-0 text-[9px] text-faint">{formatRelativeDate(conversation.lastMessageAt)}</span></div><div className="mt-1 flex items-center justify-between gap-2"><p className="truncate text-xs text-muted">{conversation.lastMessage}</p>{conversation.unreadCount ? <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[9px] leading-5 text-white">{conversation.unreadCount.toLocaleString("fa-IR")}</span> : null}</div></div></Link>)}{!conversations.length ? <div className="p-8 text-center"><MessageCircle className="mx-auto size-7 text-faint" /><p className="mt-3 text-sm text-muted">هنوز گفت‌وگویی ندارید.</p><ButtonLink href="/messages/new" size="sm" className="mt-4">شروع گفت‌وگو</ButtonLink></div> : null}</div>
        </Card>
        {selected && selectedId ? <ChatClient conversationId={selectedId} currentUserId={user.id} participant={selected.participant} initialMessages={selected.messages} /> : <Card className="hidden min-h-[560px] place-items-center text-center xl:grid"><div><MessageCircle className="mx-auto size-9 text-faint" /><h2 className="mt-4 font-semibold">یک گفت‌وگو را انتخاب کنید</h2><p className="mt-2 text-sm text-muted">پیام‌های شما اینجا نمایش داده می‌شوند.</p></div></Card>}
      </div>
    </div>
  );
}
