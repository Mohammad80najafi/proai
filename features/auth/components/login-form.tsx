"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { loginAction } from "@/features/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/features/auth/types";

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_AUTH_ACTION_STATE,
  );

  return (
    <form action={formAction} className="grid gap-5" noValidate>
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

      <Input
        label="ایمیل"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        dir="ltr"
        required
        autoFocus
        defaultValue={state.values?.email}
        placeholder="name@example.com"
        startIcon={<Mail aria-hidden="true" />}
        error={firstError(state.errors?.email)}
      />

      <Input
        label="رمز عبور"
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        required
        placeholder="••••••••"
        startIcon={<LockKeyhole aria-hidden="true" />}
        error={firstError(state.errors?.password)}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={pending}
        loadingLabel="در حال ورود…"
        className="mt-1"
      >
        ورود به ProAI
      </Button>
    </form>
  );
}

