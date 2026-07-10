import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getAuthHref, getSafeRedirectPath } from "@/lib/auth/redirect";

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
      eyebrow="خوش برگشتید"
      title="دوباره به جریان ساخت برگردید"
      description="برای دنبال‌کردن سازندگان، ذخیره محتوا و ادامه گفت‌وگوهای بهبود وارد حساب خود شوید."
      alternateLabel="هنوز حساب ندارید؟"
      alternateAction="ساخت حساب"
      alternateHref={getAuthHref("/register", redirectTo)}
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}

