"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-danger/25 bg-danger/10 text-danger">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">مشکلی پیش آمد</h1>
        <p className="mt-3 leading-8 text-muted">درخواست کامل نشد. دوباره تلاش کنید؛ اگر مشکل ادامه داشت، چند لحظه بعد برگردید.</p>
        <button type="button" onClick={reset} className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong">
          <RotateCcw className="size-4" aria-hidden="true" />
          تلاش دوباره
        </button>
      </section>
    </main>
  );
}
