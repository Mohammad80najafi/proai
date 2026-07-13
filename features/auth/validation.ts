import { z } from "zod";

const reservedUsernames = new Set([
  "admin",
  "api",
  "explore",
  "login",
  "messages",
  "notifications",
  "proai",
  "register",
  "settings",
  "skills",
  "support",
]);

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const iranianMobilePattern = /^\+989\d{9}$/;

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

export function normalizeIranianPhoneNumber(value: string): string {
  const compact = toLatinDigits(value.trim()).replace(/[\s().-]/g, "");

  if (/^00989\d{9}$/.test(compact)) {
    return `+${compact.slice(2)}`;
  }

  if (/^989\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^09\d{9}$/.test(compact)) {
    return `+98${compact.slice(1)}`;
  }

  if (/^9\d{9}$/.test(compact)) {
    return `+98${compact}`;
  }

  return compact;
}

export const iranianPhoneNumberSchema = z
  .string()
  .trim()
  .min(1, { error: "شماره موبایل را وارد کنید." })
  .max(32, { error: "شماره موبایل بیش از حد طولانی است." })
  .transform(normalizeIranianPhoneNumber)
  .refine((value) => iranianMobilePattern.test(value), {
    error: "یک شماره موبایل معتبر ایران وارد کنید؛ مانند ۰۹۱۲۳۴۵۶۷۸۹.",
  });

const otpCodeSchema = z
  .string()
  .trim()
  .transform((value) => toLatinDigits(value).replace(/\s/g, ""))
  .refine((value) => /^\d{6}$/.test(value), {
    error: "کد تأیید باید دقیقاً ۶ رقم باشد.",
  });

const redirectSchema = z.string().max(2_048).optional();
const challengeIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, { error: "درخواست کد معتبر نیست." });

export const phoneRequestSchema = z.object({
  phoneNumber: iranianPhoneNumberSchema,
  redirectTo: redirectSchema,
});

export const otpVerificationSchema = z.object({
  phoneNumber: iranianPhoneNumberSchema,
  code: otpCodeSchema,
  challengeId: challengeIdSchema,
  redirectTo: redirectSchema,
});

export const profileCompletionSchema = z.object({
  phoneNumber: iranianPhoneNumberSchema,
  challengeId: challengeIdSchema,
  displayName: z
    .string()
    .trim()
    .min(2, { error: "نام نمایشی باید حداقل ۲ نویسه باشد." })
    .max(60, { error: "نام نمایشی نباید بیش از ۶۰ نویسه باشد." }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { error: "نام کاربری باید حداقل ۳ نویسه باشد." })
    .max(30, { error: "نام کاربری نباید بیش از ۳۰ نویسه باشد." })
    .regex(/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/, {
      error: "فقط حروف انگلیسی کوچک، عدد، خط تیره و زیرخط مجاز است.",
    })
    .refine((value) => !reservedUsernames.has(value), {
      error: "این نام کاربری رزرو شده است.",
    }),
  redirectTo: redirectSchema,
});
