"use server";

import "server-only";

import { compare, hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import type {
  AuthActionState,
  AuthFieldErrors,
  AuthFormValues,
} from "@/features/auth/types";
import { loginSchema, registerSchema } from "@/features/auth/validation";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createSession, deleteSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { consumeRateLimit, getClientAddress } from "@/lib/rate-limit";
import { User } from "@/models/User";

const DUMMY_PASSWORD_HASH =
  "$2b$12$wR.q9/8UiybdmMyak6UnkeYeM4BF9f4jEZLP9LyUsXh7FTuA/Mr4y";

function textEntry(formData: FormData, key: string, maxLength: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function getFieldErrors(error: ZodError): AuthFieldErrors {
  return error.flatten().fieldErrors as AuthFieldErrors;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11_000
  );
}

async function currentUserAgent(): Promise<string> {
  return (await headers()).get("user-agent")?.slice(0, 512) ?? "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawEmail = textEntry(formData, "email", 254);
  const values: AuthFormValues = { email: rawEmail };
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: textEntry(formData, "password", 256),
    redirectTo: textEntry(formData, "redirectTo", 2_048),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "لطفاً اطلاعات ورود را بررسی کنید.",
      errors: getFieldErrors(parsed.error),
      values,
    };
  }

  const { email, password, redirectTo } = parsed.data;

  try {
    const clientAddress = await getClientAddress();
    const [clientLimit, accountLimit] = await Promise.all([
      consumeRateLimit({
        scope: "auth:login:client",
        subject: clientAddress,
        limit: 30,
        windowMs: 15 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: "auth:login:account",
        subject: `${clientAddress}:${email}`,
        limit: 8,
        windowMs: 15 * 60 * 1_000,
      }),
    ]);

    if (!clientLimit.allowed || !accountLimit.allowed) {
      return {
        status: "error",
        message: "تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
        values,
      };
    }

    await connectToDatabase();
    const user = await User.findOne({ email })
      .select(
        "+passwordHash username displayName avatar roles accountStatus reputationScore rank",
      )
      .exec();
    const passwordMatches = await compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      return {
        status: "error",
        message: "ایمیل یا رمز عبور درست نیست.",
        values,
      };
    }

    if (user.accountStatus !== "active") {
      return {
        status: "error",
        message: "این حساب در حال حاضر امکان ورود ندارد.",
        values,
      };
    }

    await createSession(user._id.toString(), {
      userAgent: await currentUserAgent(),
    });
  } catch {
    return {
      status: "error",
      message: "ورود در حال حاضر انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
      values,
    };
  }

  redirect(getSafeRedirectPath(redirectTo));
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values: AuthFormValues = {
    displayName: textEntry(formData, "displayName", 60),
    username: textEntry(formData, "username", 30),
    email: textEntry(formData, "email", 254),
  };
  const parsed = registerSchema.safeParse({
    ...values,
    password: textEntry(formData, "password", 256),
    confirmPassword: textEntry(formData, "confirmPassword", 256),
    redirectTo: textEntry(formData, "redirectTo", 2_048),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "لطفاً موارد مشخص‌شده را اصلاح کنید.",
      errors: getFieldErrors(parsed.error),
      values,
    };
  }

  const { displayName, username, email, password, redirectTo } = parsed.data;

  try {
    const clientAddress = await getClientAddress();
    const registrationLimit = await consumeRateLimit({
      scope: "auth:register:client",
      subject: clientAddress,
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });

    if (!registrationLimit.allowed) {
      return {
        status: "error",
        message: "تعداد درخواست‌های ساخت حساب بیش از حد مجاز است. بعداً دوباره تلاش کنید.",
        values,
      };
    }

    await connectToDatabase();
    const [usernameExists, emailExists] = await Promise.all([
      User.exists({ username }),
      User.exists({ email }),
    ]);

    if (usernameExists || emailExists) {
      return {
        status: "error",
        message: "برای ساخت حساب، اطلاعات تکراری را تغییر دهید.",
        errors: {
          ...(usernameExists
            ? { username: ["این نام کاربری قبلاً انتخاب شده است."] }
            : {}),
          ...(emailExists
            ? { email: ["با این ایمیل قبلاً حسابی ساخته شده است."] }
            : {}),
        },
        values,
      };
    }

    const passwordHash = await hash(password, 12);
    const user = await User.create({
      displayName,
      username,
      email,
      passwordHash,
    });

    await createSession(user._id.toString(), {
      userAgent: await currentUserAgent(),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        status: "error",
        message: "ایمیل یا نام کاربری قبلاً استفاده شده است.",
        values,
      };
    }

    return {
      status: "error",
      message: "ساخت حساب انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
      values,
    };
  }

  redirect(getSafeRedirectPath(redirectTo));
}

export async function logoutAction(): Promise<never> {
  // This mutation is intentionally idempotent and only affects the caller's
  // own opaque cookie/session pair; it accepts no client-supplied identity.
  await deleteSession();
  redirect("/login");
}
