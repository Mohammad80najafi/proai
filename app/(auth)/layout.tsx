import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { Logo } from "@/components/ui/logo";
import { getOptionalUser } from "@/lib/auth/dal";

const trustPoints = [
  {
    icon: KeyRound,
    title: "بدون نیاز به گذرواژه",
    description: "ورود با کد یک‌بارمصرف ۶ رقمی انجام می‌شود.",
  },
  {
    icon: Fingerprint,
    title: "نشست تحت کنترل شما",
    description: "هر زمان بخواهید می‌توانید از حساب خود خارج شوید.",
  },
  {
    icon: ShieldCheck,
    title: "شماره موبایل خصوصی می‌ماند",
    description: "شماره شما در پروفایل عمومی نمایش داده نمی‌شود.",
  },
] as const;

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/explore");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_75%_10%,rgba(79,70,229,0.08),transparent_24rem)] lg:grid lg:grid-cols-[minmax(24rem,0.9fr)_minmax(32rem,1.1fr)]">
      <aside className="relative hidden overflow-hidden border-l border-white/[0.07] bg-[#090d16] px-10 py-10 lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="pointer-events-none absolute -right-40 -top-36 size-[32rem] rounded-full border border-indigo-300/[0.08]" />
        <div className="pointer-events-none absolute -right-24 -top-20 size-80 rounded-full border border-indigo-300/[0.08]" />
        <div className="pointer-events-none absolute right-24 top-28 size-2 rounded-full bg-indigo-300/70 shadow-[0_0_30px_8px_rgba(129,140,248,0.2)]" />

        <Logo className="relative w-fit" />

        <div className="relative my-auto max-w-lg py-10">
          <p className="mb-4 text-xs font-semibold tracking-wide text-indigo-300">
            ورود به فضای همکاری
          </p>
          <h2 className="balanced-text text-3xl font-black leading-[1.55] tracking-[-0.035em] text-white xl:text-[2.65rem]">
            یک شماره، یک کد، و مسیر شما در ProAI ادامه پیدا می‌کند.
          </h2>
          <p className="pretty-text mt-5 max-w-md text-sm leading-8 text-slate-400">
            برای ساخت و بهبود پرامپت‌ها، اشتراک مهارت‌ها و گفت‌وگو با سازندگان
            وارد شوید.
          </p>

          <div className="mt-9 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="flex gap-4 border-b border-white/[0.06] p-4 last:border-b-0">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-400/[0.09] text-indigo-300">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {point.title}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-slate-600">
          <span
            className="size-1.5 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          دسترسی امن برای جامعه فارسی‌زبان هوش مصنوعی
        </div>
      </aside>

      <div className="flex min-h-screen items-start justify-center px-4 py-6 sm:items-center sm:px-8 sm:py-12">
        {children}
      </div>
    </main>
  );
}
