import Link from "next/link";
import { GitPullRequestArrow, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth/dal";

const benefits = [
  {
    icon: GitPullRequestArrow,
    title: "بهبود جمعی، نسخه‌های شفاف",
    description: "هر پیشنهاد بهبود با گفت‌وگو، تاریخچه و اعتبار سازنده ثبت می‌شود.",
  },
  {
    icon: MessagesSquare,
    title: "گفت‌وگو در بستر کار",
    description: "با سازنده پرامپت یا مهارت، دقیقاً کنار درخواست بهبود صحبت کنید.",
  },
  {
    icon: ShieldCheck,
    title: "هویت و دسترسی امن",
    description: "نشست‌های قابل ابطال و سطح دسترسی روشن، پایه همکاری قابل اعتماد است.",
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
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)]">
      <aside className="relative hidden overflow-hidden border-l border-white/[0.07] bg-[#0a0e17] px-10 py-12 lg:flex lg:flex-col xl:px-16">
        <div className="absolute -right-28 top-8 size-80 rounded-full bg-indigo-500/[0.08] blur-3xl" />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center gap-3"
          aria-label="بازگشت به صفحه اصلی ProAI"
        >
          <span className="grid size-10 place-items-center rounded-[14px] border border-indigo-400/25 bg-indigo-500/15 text-indigo-300">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight" dir="ltr">
            ProAI
          </span>
        </Link>

        <div className="relative my-auto max-w-lg py-12">
          <p className="mb-4 text-sm font-semibold text-indigo-300">
            هاب هوش مصنوعی متن‌باز
          </p>
          <h2 className="balanced-text text-3xl font-bold leading-[1.55] tracking-tight text-white xl:text-4xl">
            دانش هوش مصنوعی را با هم بسازیم، بهتر کنیم و به اشتراک بگذاریم.
          </h2>
          <p className="pretty-text mt-5 max-w-md text-sm leading-8 text-slate-400">
            جایی برای پرامپت‌ها، مهارت‌ها و همکاری‌هایی که هر نسخه را از نسخه قبل دقیق‌تر می‌کنند.
          </p>

          <div className="mt-10 grid gap-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-indigo-300">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          ساخته‌شده برای جامعه فارسی‌زبان هوش مصنوعی
        </p>
      </aside>

      <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:px-8 sm:py-12">
        {children}
      </div>
    </main>
  );
}
