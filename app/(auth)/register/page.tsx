import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getAuthHref, getSafeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "ساخت حساب",
  description: "ساخت حساب کاربری جدید در ProAI",
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectTo = getSafeRedirectPath(nextValue);

  return (
    <AuthCard
      eyebrow="شروع همکاری"
      title="هویت حرفه‌ای خود را در ProAI بسازید"
      description="پرامپت و مهارت منتشر کنید، پیشنهادهای بهبود بدهید و اعتبار تخصصی خود را مرحله‌به‌مرحله افزایش دهید."
      alternateLabel="از قبل حساب دارید؟"
      alternateAction="ورود"
      alternateHref={getAuthHref("/login", redirectTo)}
    >
      <RegisterForm redirectTo={redirectTo} />
    </AuthCard>
  );
}

