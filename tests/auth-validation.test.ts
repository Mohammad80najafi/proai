import { describe, expect, it } from "vitest";

import {
  iranianPhoneNumberSchema,
  normalizeIranianPhoneNumber,
  otpVerificationSchema,
  phoneRequestSchema,
  profileCompletionSchema,
} from "@/features/auth/validation";

describe("Iranian mobile authentication validation", () => {
  it.each([
    ["09123456789", "+989123456789"],
    ["+98 912 345 6789", "+989123456789"],
    ["0098-912-345-6789", "+989123456789"],
    ["989123456789", "+989123456789"],
    ["۹۱۲۳۴۵۶۷۸۹", "+989123456789"],
    ["٠٩١٢٣٤٥٦٧٨٩", "+989123456789"],
  ])("normalizes %s to the canonical E.164 value", (input, expected) => {
    expect(normalizeIranianPhoneNumber(input)).toBe(expected);
    expect(iranianPhoneNumberSchema.parse(input)).toBe(expected);
  });

  it.each(["+447700900123", "02112345678", "0912345678", "091234567890"])(
    "rejects non-Iranian or malformed number %s",
    (phoneNumber) => {
      expect(iranianPhoneNumberSchema.safeParse(phoneNumber).success).toBe(false);
    },
  );

  it("returns the canonical phone number from the request schema", () => {
    expect(
      phoneRequestSchema.parse({ phoneNumber: "۰۹۱۲۳۴۵۶۷۸۹" }),
    ).toMatchObject({ phoneNumber: "+989123456789" });
  });

  it("accepts Persian digits in a six-digit OTP", () => {
    expect(
      otpVerificationSchema.parse({
        phoneNumber: "09123456789",
        code: "۱۲۳۴۵۶",
        challengeId: "507f1f77bcf86cd799439011",
      }),
    ).toMatchObject({ code: "123456" });
  });

  it("requires profile details only after a valid challenge identifier", () => {
    expect(
      profileCompletionSchema.safeParse({
        phoneNumber: "09123456789",
        challengeId: "invalid",
        displayName: "کاربر تازه",
        username: "new_user",
      }).success,
    ).toBe(false);
  });
});
