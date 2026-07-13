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
      eyebrow="ورود امن با کد یک‌بارمصرف"
      title="ورود یا ساخت حساب"
      description="شماره موبایل ایرانی خود را وارد کنید؛ حساب‌های موجود مستقیم وارد می‌شوند و کاربران تازه پس از تأیید شماره، پروفایل خود را کامل می‌کنند."
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
