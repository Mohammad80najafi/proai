"use server";

import "server-only";

import { Types } from "mongoose";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import type {
  AuthActionState,
  AuthFieldErrors,
  AuthFormValues,
} from "@/features/auth/types";
import {
  otpVerificationSchema,
  phoneRequestSchema,
  profileCompletionSchema,
} from "@/features/auth/validation";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_PROFILE_TTL_MS,
  OTP_TTL_MS,
  otpCodeMatches,
  sendOtpCode,
} from "@/lib/auth/otp";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createSession, deleteSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { consumeRateLimit, getClientAddress } from "@/lib/rate-limit";
import { OtpChallenge } from "@/models/OtpChallenge";
import { User } from "@/models/User";

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

function maskedPhoneNumber(phoneNumber: string): string {
  const national = `0${phoneNumber.slice(3)}`;
  return `${national.slice(0, 4)} *** ${national.slice(-4)}`;
}

function codePhaseState(
  phoneNumber: string,
  challengeId: string,
  overrides: Partial<AuthActionState> = {},
): AuthActionState {
  return {
    status: "error",
    phase: "code",
    values: { phoneNumber },
    challengeId,
    maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
    ...overrides,
  };
}

async function currentUserAgent(): Promise<string> {
  return (await headers()).get("user-agent")?.slice(0, 512) ?? "";
}

async function requestOtp(
  formData: FormData,
  previousState: AuthActionState,
): Promise<AuthActionState> {
  const rawPhoneNumber = textEntry(formData, "phoneNumber", 32);
  const values: AuthFormValues = { phoneNumber: rawPhoneNumber };
  const parsed = phoneRequestSchema.safeParse({
    phoneNumber: rawPhoneNumber,
    redirectTo: textEntry(formData, "redirectTo", 2_048),
  });

  if (!parsed.success) {
    return {
      status: "error",
      phase: "phone",
      message: "شماره موبایل را بررسی کنید.",
      errors: getFieldErrors(parsed.error),
      values,
    };
  }

  const { phoneNumber } = parsed.data;

  try {
    const clientAddress = await getClientAddress();
    const [clientLimit, phoneLimit, cooldown] = await Promise.all([
      consumeRateLimit({
        scope: "auth:otp-request:client",
        subject: clientAddress,
        limit: 20,
        windowMs: 60 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: "auth:otp-request:phone",
        subject: phoneNumber,
        limit: 5,
        windowMs: 15 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: "auth:otp-request:cooldown",
        subject: phoneNumber,
        limit: 1,
        windowMs: 60 * 1_000,
      }),
    ]);

    if (!clientLimit.allowed || !phoneLimit.allowed || !cooldown.allowed) {
      if (
        previousState.phase === "code" &&
        previousState.challengeId &&
        previousState.values?.phoneNumber === phoneNumber
      ) {
        return codePhaseState(phoneNumber, previousState.challengeId, {
          message: "برای ارسال دوباره کد، کمی صبر کنید.",
          developmentCode: previousState.developmentCode,
        });
      }

      return {
        status: "error",
        phase: "phone",
        message: "درخواست کد بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
        values,
      };
    }

    await connectToDatabase();
    const now = new Date();
    await OtpChallenge.updateMany(
      { phoneNumber, consumedAt: null },
      { $set: { consumedAt: now } },
    );

    const challengeId = new Types.ObjectId();
    const code = generateOtpCode();
    await OtpChallenge.create({
      _id: challengeId,
      phoneNumber,
      codeHash: hashOtpCode(challengeId.toString(), code),
      attemptsRemaining: OTP_MAX_ATTEMPTS,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const delivery = await sendOtpCode(phoneNumber, code);
      return codePhaseState(phoneNumber, challengeId.toString(), {
        status: "success",
        message: "کد تأیید ارسال شد.",
        developmentCode: delivery.developmentCode,
      });
    } catch (error) {
      await OtpChallenge.deleteOne({ _id: challengeId });
      throw error;
    }
  } catch (error) {
    console.error("OTP request failed.", error);
    return {
      status: "error",
      phase: "phone",
      message: "ارسال کد انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
      values,
    };
  }
}

async function verifyOtp(formData: FormData): Promise<AuthActionState> {
  const parsed = otpVerificationSchema.safeParse({
    phoneNumber: textEntry(formData, "phoneNumber", 32),
    code: textEntry(formData, "code", 16),
    challengeId: textEntry(formData, "challengeId", 24),
    redirectTo: textEntry(formData, "redirectTo", 2_048),
  });

  if (!parsed.success) {
    const phoneNumber = textEntry(formData, "phoneNumber", 32);
    const challengeId = textEntry(formData, "challengeId", 24);
    return codePhaseState(phoneNumber, challengeId, {
      message: "کد تأیید را بررسی کنید.",
      errors: getFieldErrors(parsed.error),
    });
  }

  const { phoneNumber, code, challengeId, redirectTo } = parsed.data;

  try {
    const clientAddress = await getClientAddress();
    const verificationLimit = await consumeRateLimit({
      scope: "auth:otp-verify:client",
      subject: clientAddress,
      limit: 30,
      windowMs: 15 * 60 * 1_000,
    });

    if (!verificationLimit.allowed) {
      return codePhaseState(phoneNumber, challengeId, {
        message: "تعداد تلاش‌های تأیید بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      });
    }

    await connectToDatabase();
    const challenge = await OtpChallenge.findOneAndUpdate(
      {
        _id: challengeId,
        phoneNumber,
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attemptsRemaining: { $gt: 0 },
      },
      { $inc: { attemptsRemaining: -1 } },
      { returnDocument: "before" },
    )
      .select("+codeHash phoneNumber attemptsRemaining")
      .exec();

    if (!challenge) {
      return codePhaseState(phoneNumber, challengeId, {
        message: "این کد منقضی یا غیرفعال شده است. یک کد تازه بگیرید.",
      });
    }

    if (!otpCodeMatches(challengeId, code, challenge.codeHash)) {
      return codePhaseState(phoneNumber, challengeId, {
        message:
          challenge.attemptsRemaining <= 1
            ? "کد نادرست بود و فرصت‌های این درخواست تمام شد."
            : "کد تأیید درست نیست.",
        errors: { code: ["کد واردشده با کد ارسال‌شده یکسان نیست."] },
      });
    }

    const user = await User.findOne({ phoneNumber })
      .select("accountStatus")
      .exec();

    if (user) {
      const consumed = await OtpChallenge.updateOne(
        { _id: challengeId, verifiedAt: null, consumedAt: null },
        { $set: { verifiedAt: new Date(), consumedAt: new Date() } },
      );

      if (consumed.modifiedCount !== 1) {
        return codePhaseState(phoneNumber, challengeId, {
          message: "این کد قبلاً استفاده شده است. یک کد تازه بگیرید.",
        });
      }

      if (user.accountStatus !== "active") {
        return codePhaseState(phoneNumber, challengeId, {
          message: "این حساب در حال حاضر امکان ورود ندارد.",
        });
      }

      await createSession(user._id.toString(), {
        userAgent: await currentUserAgent(),
      });
    } else {
      const verified = await OtpChallenge.updateOne(
        { _id: challengeId, verifiedAt: null, consumedAt: null },
        {
          $set: {
            verifiedAt: new Date(),
            expiresAt: new Date(Date.now() + OTP_PROFILE_TTL_MS),
          },
        },
      );

      if (verified.modifiedCount !== 1) {
        return codePhaseState(phoneNumber, challengeId, {
          message: "این کد قبلاً استفاده شده است. یک کد تازه بگیرید.",
        });
      }

      return {
        status: "success",
        phase: "profile",
        message: "شماره موبایل تأیید شد. برای ساخت حساب، اطلاعات زیر را کامل کنید.",
        challengeId,
        maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
        values: { phoneNumber },
      };
    }
  } catch (error) {
    console.error("OTP verification failed.", error);
    return codePhaseState(phoneNumber, challengeId, {
      message: "تأیید کد انجام نشد. دوباره تلاش کنید.",
    });
  }

  redirect(getSafeRedirectPath(redirectTo));
}

class UsernameTakenError extends Error {}
class AccountUnavailableError extends Error {}
class InvalidChallengeError extends Error {}

async function completeProfile(formData: FormData): Promise<AuthActionState> {
  const values: AuthFormValues = {
    phoneNumber: textEntry(formData, "phoneNumber", 32),
    displayName: textEntry(formData, "displayName", 60),
    username: textEntry(formData, "username", 30),
  };
  const parsed = profileCompletionSchema.safeParse({
    ...values,
    challengeId: textEntry(formData, "challengeId", 24),
    redirectTo: textEntry(formData, "redirectTo", 2_048),
  });

  if (!parsed.success) {
    return {
      status: "error",
      phase: "profile",
      message: "لطفاً اطلاعات حساب را بررسی کنید.",
      errors: getFieldErrors(parsed.error),
      values,
      challengeId: textEntry(formData, "challengeId", 24),
      maskedPhoneNumber: maskedPhoneNumber(values.phoneNumber ?? ""),
    };
  }

  const { phoneNumber, challengeId, displayName, username, redirectTo } =
    parsed.data;

  try {
    const clientAddress = await getClientAddress();
    const registrationLimit = await consumeRateLimit({
      scope: "auth:registration:client",
      subject: clientAddress,
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });

    if (!registrationLimit.allowed) {
      return {
        status: "error",
        phase: "profile",
        message: "تعداد درخواست‌های ساخت حساب بیش از حد مجاز است.",
        values,
        challengeId,
        maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
      };
    }

    const database = await connectToDatabase();
    let authenticatedUserId: string | null = null;

    await database.connection.transaction(async (session) => {
      const challenge = await OtpChallenge.findOne({
        _id: challengeId,
        phoneNumber,
        verifiedAt: { $ne: null },
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      })
        .session(session)
        .exec();

      if (!challenge) {
        throw new InvalidChallengeError();
      }

      const existingUser = await User.findOne({ phoneNumber })
        .select("accountStatus")
        .session(session)
        .exec();

      if (existingUser) {
        if (existingUser.accountStatus !== "active") {
          throw new AccountUnavailableError();
        }
        authenticatedUserId = existingUser._id.toString();
      } else {
        const usernameExists = await User.exists({ username }).session(session);
        if (usernameExists) {
          throw new UsernameTakenError();
        }

        const [user] = await User.create(
          [{ displayName, username, phoneNumber }],
          { session },
        );
        authenticatedUserId = user._id.toString();
      }

      const consumed = await OtpChallenge.updateOne(
        {
          _id: challengeId,
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { consumedAt: new Date() } },
        { session },
      );

      if (consumed.modifiedCount !== 1) {
        throw new InvalidChallengeError();
      }
    });

    if (!authenticatedUserId) {
      throw new InvalidChallengeError();
    }

    await createSession(authenticatedUserId, {
      userAgent: await currentUserAgent(),
    });
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return {
        status: "error",
        phase: "profile",
        message: "این نام کاربری قبلاً انتخاب شده است.",
        errors: { username: ["یک نام کاربری دیگر انتخاب کنید."] },
        values,
        challengeId,
        maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
      };
    }

    if (error instanceof AccountUnavailableError) {
      return {
        status: "error",
        phase: "profile",
        message: "این حساب در حال حاضر امکان ورود ندارد.",
        values,
        challengeId,
        maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
      };
    }

    if (error instanceof InvalidChallengeError) {
      return {
        status: "error",
        phase: "phone",
        message: "زمان تکمیل حساب تمام شده است. دوباره شماره خود را تأیید کنید.",
        values: { phoneNumber },
      };
    }

    if (isDuplicateKeyError(error)) {
      return {
        status: "error",
        phase: "profile",
        message: "شماره موبایل یا نام کاربری قبلاً استفاده شده است.",
        values,
        challengeId,
        maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
      };
    }

    console.error("Profile completion failed.", error);
    return {
      status: "error",
      phase: "profile",
      message: "ساخت حساب انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
      values,
      challengeId,
      maskedPhoneNumber: maskedPhoneNumber(phoneNumber),
    };
  }

  redirect(getSafeRedirectPath(redirectTo));
}

export async function authAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const intent = textEntry(formData, "intent", 16);

  if (intent === "request") return requestOtp(formData, previousState);
  if (intent === "verify") return verifyOtp(formData);
  if (intent === "complete") return completeProfile(formData);

  return { status: "idle", phase: "phone" };
}

export async function logoutAction(): Promise<never> {
  await deleteSession();
  redirect("/login");
}
