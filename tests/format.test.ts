import { describe, expect, it } from "vitest";
import { makeSlug, toPersianDigits } from "@/lib/format";

describe("Persian formatting helpers", () => {
  it("converts Latin digits without changing surrounding text", () => {
    expect(toPersianDigits("نسخه 12.4")).toBe("نسخه ۱۲.۴");
  });

  it("builds stable Persian and English slugs", () => {
    expect(makeSlug("  تحلیل‌گر حرفه‌ای پرامپت  ")).toBe("تحلیل-گر-حرفه-ای-پرامپت");
    expect(makeSlug("Senior Full Stack Developer")).toBe("senior-full-stack-developer");
  });
});
