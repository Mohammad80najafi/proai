import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری ProAI",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectTo = getSafeRedirectPath(nextValue);

  return (
    <AuthCard
      eyebrow="ورود امن به ProAI"
      title="ورود یا ساخت حساب"
      description="شماره موبایل خود را وارد کنید تا کد ۶ رقمی ورود برایتان ارسال شود.">
      <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-center text-sm leading-6 text-amber-100">
        <p>برای دسترسی به پنل مدیریت با این شماره وارد شوید:</p>
        <strong className="mt-1 block font-mono text-center ">
          09383091833
        </strong>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
