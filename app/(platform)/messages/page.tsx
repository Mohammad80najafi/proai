import Link from "next/link";
import { MessageCircle, Plus, Search, SearchX } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { ChatClient } from "@/features/chat/chat-client";
import { getConversationList, getConversationMessages } from "@/features/chat/data";
import { requireUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

type SearchParams = Promise<{ conversation?: string; q?: string }>;
export const metadata = { title: "پیام‌ها" };

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const query = await searchParams;
  const conversations = await getConversationList(user.id).catch(() => []);
  const searchTerm = query.q?.trim().toLocaleLowerCase("fa-IR") ?? "";
  const visibleConversations = searchTerm
    ? conversations.filter((conversation) =>
        [
          conversation.participant.displayName,
          conversation.participant.username,
          conversation.lastMessage,
        ].some((value) => value.toLocaleLowerCase("fa-IR").includes(searchTerm)),
      )
    : conversations;
  const selectedId = query.conversation;
  const selected = selectedId ? await getConversationMessages(selectedId, user.id).catch(() => null) : null;
  const showMobileChat = Boolean(query.conversation && selected);
  const unreadConversationCount = conversations.filter((conversation) => conversation.unreadCount > 0).length;
  const backHref = searchTerm ? `/messages?q=${encodeURIComponent(query.q?.trim() ?? "")}` : "/messages";

  return (
    <div className="h-full min-h-0">
      <div className="grid h-full min-h-0 overflow-hidden rounded-[22px] border border-white/[0.08] bg-surface shadow-[0_24px_70px_rgba(0,0,0,0.24)] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-h-0 flex-col border-white/[0.07] bg-[#0a0f18] lg:flex lg:border-e",
            showMobileChat ? "hidden" : "flex",
          )}
          aria-label="فهرست گفت‌وگوها"
        >
          <div className="shrink-0 border-b border-white/[0.07] px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-100">پیام‌ها</h1>
                  <span className="text-[11px] tabular-nums text-faint">
                    {conversations.length.toLocaleString("fa-IR")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {unreadConversationCount
                    ? `${unreadConversationCount.toLocaleString("fa-IR")} گفت‌وگوی خوانده‌نشده`
                    : "همه پیام‌ها خوانده شده‌اند"}
                </p>
              </div>
              <ButtonLink
                href="/messages/new"
                size="icon"
                className="size-11"
                aria-label="شروع گفت‌وگوی تازه"
              >
                <Plus className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>

            <form action="/messages" method="get" className="mt-4">
              <label htmlFor="conversation-search" className="sr-only">جست‌وجوی گفت‌وگوها</label>
              <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint" aria-hidden="true" />
                <input
                  id="conversation-search"
                  name="q"
                  type="search"
                  defaultValue={query.q}
                  placeholder="نام کاربر یا متن پیام"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] ps-10 pe-3 text-base text-slate-100 outline-none transition-colors placeholder:text-faint hover:border-white/[0.13] focus:border-primary/55 focus:ring-4 focus:ring-primary/10 sm:text-sm"
                />
              </div>
            </form>
          </div>

          <nav className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" aria-label="گفت‌وگوها">
            <ul className="space-y-1">
              {visibleConversations.map((conversation) => {
                const active = selectedId === conversation.id;
                const href = `/messages?conversation=${conversation.id}${searchTerm ? `&q=${encodeURIComponent(query.q?.trim() ?? "")}` : ""}`;

                return (
                  <li key={conversation.id}>
                    <Link
                      href={href}
                      prefetch={false}
                      scroll={false}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex min-h-[68px] items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/70 motion-reduce:transition-none",
                        active
                          ? "bg-primary-soft text-slate-100"
                          : "text-slate-300 hover:bg-white/[0.045]",
                      )}
                    >
                      {active ? <span aria-hidden="true" className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-primary shadow-[0_0_14px_rgba(124,134,255,0.7)]" /> : null}
                      <Avatar
                        src={conversation.participant.avatar}
                        fallback={conversation.participant.displayName}
                        alt={conversation.participant.displayName}
                        size="md"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <strong className={cn("truncate text-sm", conversation.unreadCount ? "font-bold text-slate-100" : "font-semibold")}>
                            {conversation.participant.displayName}
                          </strong>
                          <time dateTime={conversation.lastMessageAt} className="shrink-0 text-[10px] tabular-nums text-faint">
                            {formatRelativeDate(conversation.lastMessageAt)}
                          </time>
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className={cn("min-w-0 flex-1 truncate text-xs", conversation.unreadCount ? "text-slate-300" : "text-muted")}>
                            {conversation.lastMessage}
                          </span>
                          {conversation.unreadCount ? (
                            <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-5 text-white">
                              {conversation.unreadCount > 99 ? "+۹۹" : conversation.unreadCount.toLocaleString("fa-IR")}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!visibleConversations.length ? (
              <div className="grid min-h-56 place-items-center px-6 text-center">
                <div>
                  {searchTerm ? <SearchX className="mx-auto size-8 text-faint" /> : <MessageCircle className="mx-auto size-8 text-faint" />}
                  <h2 className="mt-4 text-sm font-semibold text-slate-200">
                    {searchTerm ? "گفت‌وگویی پیدا نشد" : "هنوز گفت‌وگویی ندارید"}
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    {searchTerm ? "نام کاربر یا عبارت دیگری را جست‌وجو کنید." : "برای ارتباط با یکی از اعضای جامعه، یک گفت‌وگوی تازه بسازید."}
                  </p>
                  {!searchTerm ? <ButtonLink href="/messages/new" size="sm" className="mt-4"><Plus className="size-4" />شروع گفت‌وگو</ButtonLink> : null}
                </div>
              </div>
            ) : null}
          </nav>
        </aside>

        <section
          className={cn(
            "min-h-0 min-w-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,134,255,0.055),transparent_34%)] lg:flex",
            showMobileChat ? "flex" : "hidden",
          )}
          aria-label="گفت‌وگوی انتخاب‌شده"
        >
          {selected && selectedId ? (
            <ChatClient
              key={selectedId}
              conversationId={selectedId}
              currentUserId={user.id}
              participant={selected.participant}
              initialMessages={selected.messages}
              backHref={backHref}
            />
          ) : (
            <div className="hidden h-full w-full place-items-center px-8 text-center lg:grid">
              <div className="max-w-sm">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-primary-strong">
                  <MessageCircle className="size-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-semibold text-slate-100">یک گفت‌وگو را انتخاب کنید</h2>
                <p className="mt-2 text-sm leading-7 text-muted">پیام‌ها بدون جابه‌جایی صفحه در همین فضای کاری نمایش داده می‌شوند.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
