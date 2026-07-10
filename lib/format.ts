const persianNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const persianCompact = new Intl.NumberFormat("fa-IR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const persianRelative = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });

export function formatNumber(value: number, compact = false) {
  return (compact ? persianCompact : persianNumber).format(value);
}

export function formatDate(value: Date | string | number) {
  return persianDate.format(new Date(value));
}

export function formatRelativeDate(value: Date | string | number) {
  const deltaSeconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(deltaSeconds) >= seconds || unit === "minute") {
      return persianRelative.format(Math.round(deltaSeconds / seconds), unit);
    }
  }

  return "همین حالا";
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function makeSlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u200c\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
