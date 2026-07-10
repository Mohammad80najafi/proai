import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  alternateLabel: string;
  alternateAction: string;
  alternateHref: string;
  children: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  alternateLabel,
  alternateAction,
  alternateHref,
  children,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-[31rem] animate-soft-enter">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2.5 text-sm font-semibold text-slate-100 lg:hidden"
        aria-label="بازگشت به صفحه اصلی ProAI"
      >
        <span className="grid size-9 place-items-center rounded-xl border border-indigo-400/25 bg-indigo-500/15 text-indigo-300">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <span dir="ltr">ProAI</span>
      </Link>

      <div className="rounded-2xl border border-white/[0.09] bg-[#0d121c]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
        <header className="mb-7">
          <p className="mb-3 text-xs font-semibold tracking-wide text-indigo-300">
            {eyebrow}
          </p>
          <h1 className="balanced-text text-2xl font-bold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
            {title}
          </h1>
          <p className="pretty-text mt-3 text-sm leading-7 text-slate-400">
            {description}
          </p>
        </header>

        {children}

        <footer className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-slate-400">
          <span>{alternateLabel}</span>{" "}
          <Link
            href={alternateHref}
            className="inline-flex items-center gap-1 font-semibold text-indigo-300 transition-colors hover:text-indigo-200"
          >
            {alternateAction}
            <ArrowLeft className="size-3.5" aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  );
}

