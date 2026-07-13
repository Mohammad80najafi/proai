"use client";

import { useActionState } from "react";
import { AtSign, KeyRound, Smartphone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { authAction } from "@/features/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/features/auth/types";

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
  return (
    <div
      className={
        isError
          ? "rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-200"
          : "rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-sm leading-6 text-emerald-200"
      }
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      {message}
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
      <div className="grid gap-5">
        <StatusMessage status={state.status} message={state.message} />

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          کد ۶ رقمی به <span dir="ltr" className="font-semibold text-white">{state.maskedPhoneNumber}</span> ارسال شد.
        </div>

        {state.developmentCode ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100">
            کد محیط توسعه: <strong dir="ltr" className="font-mono text-base">{state.developmentCode}</strong>
          </div>
        ) : null}

        <form action={formAction} className="grid gap-5" noValidate>
          <input type="hidden" name="intent" value="verify" />
          <input type="hidden" name="phoneNumber" value={state.values?.phoneNumber} />
          <input type="hidden" name="challengeId" value={state.challengeId} />
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
            startIcon={<KeyRound aria-hidden="true" />}
            error={firstError(state.errors?.code)}
          />
          <Button type="submit" size="lg" fullWidth loading={pending} loadingLabel="در حال تأیید…">
            تأیید و ادامه
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-3">
          <form action={formAction}>
            <input type="hidden" name="intent" value="request" />
            <input type="hidden" name="phoneNumber" value={state.values?.phoneNumber} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button type="submit" variant="secondary" fullWidth disabled={pending}>ارسال دوباره</Button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="intent" value="reset" />
            <Button type="submit" variant="ghost" fullWidth disabled={pending}>تغییر شماره</Button>
          </form>
        </div>
      </div>
    );
  }

  if (state.phase === "profile") {
    return (
      <form action={formAction} className="grid gap-4" noValidate>
        <input type="hidden" name="intent" value="complete" />
        <input type="hidden" name="phoneNumber" value={state.values?.phoneNumber} />
        <input type="hidden" name="challengeId" value={state.challengeId} />
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <StatusMessage status={state.status} message={state.message} />

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          شماره تأییدشده: <span dir="ltr" className="font-semibold text-white">{state.maskedPhoneNumber}</span>
        </div>

        <Input
          label="نام نمایشی"
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
        <Button type="submit" size="lg" fullWidth loading={pending} loadingLabel="در حال ساخت حساب…">
          ساخت حساب و ورود
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input type="hidden" name="intent" value="request" />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <StatusMessage status={state.status} message={state.message} />
      <Input
        label="شماره موبایل ایران"
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
      <p className="text-xs leading-6 text-slate-500">
        اگر حساب داشته باشید با کد یک‌بارمصرف وارد می‌شوید؛ در غیر این صورت پس از تأیید شماره، اطلاعات حساب را کامل می‌کنید.
      </p>
      <Button type="submit" size="lg" fullWidth loading={pending} loadingLabel="در حال ارسال کد…">
        دریافت کد تأیید
      </Button>
    </form>
  );
}
