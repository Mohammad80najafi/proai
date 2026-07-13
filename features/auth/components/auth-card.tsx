import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { Logo } from "@/components/ui/logo";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-[30rem] animate-soft-enter">
      <Logo className="mb-7 lg:hidden" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0d121c]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] sm:p-8">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" aria-hidden="true" />

        <header className="mb-6">
          <p className="mb-3 text-[11px] font-semibold tracking-wide text-indigo-300">
            {eyebrow}
          </p>
          <h1 className="balanced-text text-2xl font-black tracking-[-0.03em] text-white sm:text-[2rem] sm:leading-tight">
            {title}
          </h1>
          <p className="pretty-text mt-3 max-w-md text-sm leading-7 text-slate-400">
            {description}
          </p>
        </header>

        {children}

        <footer className="mt-6 flex items-start gap-2 border-t border-white/[0.07] pt-5 text-[11px] leading-6 text-slate-500">
          <ShieldCheck className="mt-1 size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
          کد ورود و اطلاعات حساب شما فقط برای تأیید هویت استفاده می‌شوند.
        </footer>
      </div>
    </section>
  );
}
