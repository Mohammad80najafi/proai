import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-border bg-surface text-primary">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold text-primary">خطای ۴۰۴</p>
        <h1 className="balanced-text text-3xl font-bold tracking-tight">این صفحه پیدا نشد</h1>
        <p className="pretty-text mt-3 leading-8 text-muted">ممکن است محتوا حذف شده باشد یا نشانی را اشتباه وارد کرده باشید.</p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong">
          <ArrowRight className="size-4" aria-hidden="true" />
          بازگشت به خانه
        </Link>
      </section>
    </main>
  );
}
