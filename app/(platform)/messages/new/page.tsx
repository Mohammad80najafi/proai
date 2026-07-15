import Link from "next/link";
import { Search, SearchX, Sparkles, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { NewConversationForm } from "@/features/chat/new-conversation-form";
import { getMessageUserSuggestions } from "@/features/chat/data";
import { MessageUserSearch } from "@/features/chat/message-user-search";
import { requireUser } from "@/lib/auth/dal";
import { formatNumber } from "@/lib/format";

type SearchParams = Promise<{ q?: string; user?: string }>;

export const metadata = { title: "گفت‌وگوی تازه" };

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [current, query] = await Promise.all([requireUser(), searchParams]);
  const searchTerm = (query.q ?? query.user ?? "").trim();
  const users = await getMessageUserSuggestions(current.id, searchTerm).catch(() => []);
  const isSearching = Boolean(searchTerm);

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        eyebrow="پیام خصوصی"
        title="با چه کسی گفت‌وگو می‌کنید؟"
        description="نام یا نام کاربری یکی از اعضای جامعه را جست‌وجو کنید و مستقیم گفت‌وگو را شروع کنید."
        breadcrumbs={[
          { label: "پیام‌ها", href: "/messages" },
          { label: "گفت‌وگوی تازه" },
        ]}
      />

      <Card className="relative overflow-hidden p-4 sm:p-5">
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-cyan-200/45 to-transparent"
          aria-hidden="true"
        />
        <MessageUserSearch initialValue={searchTerm} />
      </Card>

      <section aria-labelledby="message-user-results">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="message-user-results" className="flex items-center gap-2 text-base font-bold text-slate-100">
              {isSearching ? (
                <Search className="size-4 text-cyan-200" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4 text-cyan-200" aria-hidden="true" />
              )}
              {isSearching ? "نتایج جست‌وجو" : "اعضای پیشنهادی"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {isSearching
                ? `نتیجه برای «${searchTerm}»`
                : "چند عضو فعال برای شروع یک گفت‌وگوی تازه"}
            </p>
          </div>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[11px] tabular-nums text-faint">
            {users.length.toLocaleString("fa-IR")} کاربر
          </span>
        </div>

        {users.length ? (
          <div className="space-y-2">
            {users.map((user) => (
              <Card
                key={user.id}
                interactive
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/users/${user.username}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                >
                  <Avatar
                    src={user.avatar}
                    fallback={user.displayName}
                    alt={user.displayName}
                    size="lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <strong className="truncate text-sm font-bold text-slate-100">
                        {user.displayName}
                      </strong>
                      <span className="font-mono text-[11px] text-indigo-200/65" dir="ltr">
                        @{user.username}
                      </span>
                    </span>
                    <span className="mt-1.5 block truncate text-xs text-muted">
                      {user.bio || "هنوز معرفی کوتاهی ننوشته است."}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-faint">
                      <Users className="size-3" aria-hidden="true" />
                      {formatNumber(user.followers)} دنبال‌کننده
                    </span>
                  </span>
                </Link>
                <NewConversationForm targetUserId={user.id} compact />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="grid min-h-56 place-items-center p-8 text-center">
            <div className="max-w-sm">
              <SearchX className="mx-auto size-8 text-faint" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-semibold text-slate-200">کاربری پیدا نشد</h3>
              <p className="mt-2 text-xs leading-6 text-muted">
                نام نمایشی یا نام کاربری دیگری را امتحان کنید.
              </p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
