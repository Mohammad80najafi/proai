import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/env";

export const OTP_CODE_LENGTH = 6;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_TTL_MS = 3 * 60 * 1_000;
export const OTP_PROFILE_TTL_MS = 10 * 60 * 1_000;

const DEVELOPMENT_OTP_SECRET =
  "proai-development-only-otp-secret-change-in-production";

function getOtpSecret(): string {
  const secret = getServerEnv().AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_OTP_SECRET;
  }

  throw new Error("AUTH_SECRET is required for production OTP authentication.");
}

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_CODE_LENGTH)
    .toString()
    .padStart(OTP_CODE_LENGTH, "0");
}

export function hashOtpCode(challengeId: string, code: string): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${challengeId}:${code}`, "utf8")
    .digest("hex");
}

export function otpCodeMatches(
  challengeId: string,
  code: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashOtpCode(challengeId, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function toNationalPhoneNumber(phoneNumber: string): string {
  return `0${phoneNumber.slice(3)}`;
}

type OtpDeliveryResult = { developmentCode?: string };

type KavenegarResponse = {
  return?: { status?: number; message?: string };
};

export async function sendOtpCode(
  phoneNumber: string,
  code: string,
): Promise<OtpDeliveryResult> {
  const env = getServerEnv();

  if (env.OTP_PROVIDER === "console") {
    if (process.env.NODE_ENV === "production" && !env.OTP_EXPOSE_CODE) {
      throw new Error("Console OTP delivery is disabled in production.");
    }

    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth:otp] ${phoneNumber}: ${code}`);
    }
    return { developmentCode: code };
  }

  if (!env.KAVENEGAR_API_KEY) {
    throw new Error("KAVENEGAR_API_KEY is required for OTP delivery.");
  }

  const endpoint = `https://api.kavenegar.com/v1/${encodeURIComponent(env.KAVENEGAR_API_KEY)}/verify/lookup.json`;
  const body = new URLSearchParams({
    receptor: toNationalPhoneNumber(phoneNumber),
    token: code,
    template: env.KAVENEGAR_OTP_TEMPLATE,
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json().catch(() => null)) as KavenegarResponse | null;

  if (!response.ok || result?.return?.status !== 200) {
    throw new Error("The SMS provider did not accept the OTP message.");
  }

  return env.OTP_EXPOSE_CODE ? { developmentCode: code } : {};
}
