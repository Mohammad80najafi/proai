"use client";

import { useActionState } from "react";
import { AtSign, LockKeyhole, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { registerAction } from "@/features/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/features/auth/types";

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    INITIAL_AUTH_ACTION_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.message ? (
        <div
          className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-200"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Input
        label="ایمیل"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        placeholder="name@example.com"
        startIcon={<Mail aria-hidden="true" />}
        error={firstError(state.errors?.email)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="رمز عبور"
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          placeholder="حداقل ۸ نویسه"
          startIcon={<LockKeyhole aria-hidden="true" />}
          error={firstError(state.errors?.password)}
        />

        <Input
          label="تکرار رمز عبور"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          required
          placeholder="تکرار رمز عبور"
          startIcon={<LockKeyhole aria-hidden="true" />}
          error={firstError(state.errors?.confirmPassword)}
        />
      </div>

      <p className="text-xs leading-6 text-slate-500">
        رمز عبور باید حداقل ۸ نویسه و شامل یک حرف و یک عدد باشد.
      </p>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={pending}
        loadingLabel="در حال ساخت حساب…"
        className="mt-1"
      >
        ساخت حساب کاربری
      </Button>
    </form>
  );
}

