"use client";

import { useActionState } from "react";
import {
  AtSign,
  Check,
  CircleAlert,
  CircleCheck,
  KeyRound,
  Smartphone,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/form-controls";
import { authAction } from "@/features/auth/actions";
import {
  INITIAL_AUTH_ACTION_STATE,
  type AuthPhase,
} from "@/features/auth/types";

const AUTH_STEPS = [
  { phase: "phone", label: "شماره موبایل" },
  { phase: "code", label: "تأیید کد" },
  { phase: "profile", label: "تکمیل حساب" },
] as const;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message?: string;
}) {
  if (!message) return null;

  const isError = status === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      className={
        isError
          ? "flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-3.5 py-3 text-sm leading-6 text-red-200"
          : "flex items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-3.5 py-3 text-sm leading-6 text-emerald-200"
      }
      role={isError ? "alert" : "status"}
      aria-live="polite">
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function AuthProgress({ phase }: { phase: AuthPhase }) {
  const currentIndex = AUTH_STEPS.findIndex((step) => step.phase === phase);

  return (
    <nav aria-label="مراحل ورود" className="relative mb-6">
      <div
        className="absolute inset-x-[16.66%] top-4 h-px bg-white/[0.09]"
        aria-hidden="true"
      />
      <ol className="relative grid grid-cols-3">
        {AUTH_STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;

          return (
            <li
              key={step.phase}
              className={cn(
                "grid justify-items-center gap-2 text-center text-[10px]",
                current ? "text-indigo-200" : "text-slate-600",
              )}
              aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border bg-[#0d121c] font-mono text-[10px] transition-colors",
                  complete &&
                    "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                  current &&
                    "border-indigo-400/50 bg-indigo-400/10 text-indigo-200 shadow-[0_0_0_4px_rgba(99,102,241,0.07)]",
                  !complete && !current && "border-white/[0.09] text-slate-600",
                )}>
                {complete ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AuthFormFrame({
  phase,
  children,
}: {
  phase: AuthPhase;
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthProgress phase={phase} />
      {children}
    </>
  );
}

function PhoneSummary({
  label,
  phoneNumber,
}: {
  label: string;
  phoneNumber?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-400/[0.09] text-indigo-300">
        <Smartphone className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p
          dir="ltr"
          className="mt-1 truncate font-mono text-sm font-semibold text-slate-100">
          {phoneNumber}
        </p>
      </div>
    </div>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    authAction,
    INITIAL_AUTH_ACTION_STATE,
  );

  if (state.phase === "code") {
    return (
      <AuthFormFrame phase="code">
        <div className="grid gap-4">
          <StatusMessage status={state.status} message={state.message} />
          <PhoneSummary
            label="کد ارسال شد به"
            phoneNumber={state.maskedPhoneNumber}
          />

          {state.developmentCode ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-3.5 py-3 text-xs text-amber-100">
              <span>کد محیط توسعه</span>
              <strong
                dir="ltr"
                className="font-mono text-base tracking-[0.18em]">
                {state.developmentCode}
              </strong>
            </div>
          ) : null}

          <form action={formAction} className="grid gap-5" noValidate>
            <input type="hidden" name="intent" value="verify" />
            <input
              type="hidden"
              name="phoneNumber"
              value={state.values?.phoneNumber ?? ""}
            />
            <input
              type="hidden"
              name="challengeId"
              value={state.challengeId ?? ""}
            />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Input
              label="کد تأیید"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              minLength={6}
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              className="text-center font-mono text-base tracking-[0.22em]"
              startIcon={<KeyRound aria-hidden="true" />}
              error={firstError(state.errors?.code)}
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={pending}
              loadingLabel="در حال تأیید…">
              تأیید و ورود
            </Button>
          </form>

          <div className="grid grid-cols-2 gap-2.5">
            <form action={formAction}>
              <input type="hidden" name="intent" value="request" />
              <input
                type="hidden"
                name="phoneNumber"
                value={state.values?.phoneNumber ?? ""}
              />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                disabled={pending}>
                ارسال دوباره
              </Button>
            </form>
            <form action={formAction}>
              <input type="hidden" name="intent" value="reset" />
              <Button
                type="submit"
                variant="ghost"
                fullWidth
                disabled={pending}>
                تغییر شماره
              </Button>
            </form>
          </div>
        </div>
      </AuthFormFrame>
    );
  }

  if (state.phase === "profile") {
    return (
      <AuthFormFrame phase="profile">
        <form action={formAction} className="grid gap-4" noValidate>
          <input type="hidden" name="intent" value="complete" />
          <input
            type="hidden"
            name="phoneNumber"
            value={state.values?.phoneNumber ?? ""}
          />
          <input
            type="hidden"
            name="challengeId"
            value={state.challengeId ?? ""}
          />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <StatusMessage status={state.status} message={state.message} />
          <PhoneSummary
            label="شماره تأییدشده"
            phoneNumber={state.maskedPhoneNumber}
          />

          <Input
            label="نام نمایشی"
            hint="نامی که دیگران در ProAI می‌بینند."
            name="displayName"
            type="text"
            autoComplete="name"
            required
            autoFocus
            defaultValue={state.values?.displayName}
            placeholder="مثلاً سارا احمدی"
            startIcon={<UserRound aria-hidden="true" />}
            error={firstError(state.errors?.displayName)}
          />
          <Input
            label="نام کاربری"
            hint="فقط حروف انگلیسی، عدد، خط تیره یا زیرخط."
            name="username"
            type="text"
            autoComplete="username"
            dir="ltr"
            required
            defaultValue={state.values?.username}
            placeholder="sara_dev"
            startIcon={<AtSign aria-hidden="true" />}
            error={firstError(state.errors?.username)}
          />
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={pending}
            loadingLabel="در حال ساخت حساب…">
            ساخت حساب و ورود
          </Button>
        </form>
      </AuthFormFrame>
    );
  }

  return (
    <AuthFormFrame phase="phone">
      <form action={formAction} className="grid gap-5" noValidate>
        <input type="hidden" name="intent" value="request" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <StatusMessage status={state.status} message={state.message} />
        <Input
          label="شماره موبایل"
          hint="با ۰۹ شروع می‌شود و ۱۱ رقم دارد."
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          required
          autoFocus
          defaultValue={state.values?.phoneNumber}
          placeholder="09123456789"
          startIcon={<Smartphone aria-hidden="true" />}
          error={firstError(state.errors?.phoneNumber)}
        />
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending}
          loadingLabel="در حال ارسال کد…">
          دریافت کد تأیید
        </Button>
      </form>
    </AuthFormFrame>
  );
}
