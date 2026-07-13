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
      description="شماره موبایل خود را وارد کنید تا کد ۶ رقمی ورود برایتان ارسال شود."
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
