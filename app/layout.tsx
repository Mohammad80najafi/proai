import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProAI — هاب هوش مصنوعی",
    template: "%s | ProAI",
  },
  description:
    "جامعه‌ای برای ساخت، بهبود و اشتراک‌گذاری پرامپت‌ها و مهارت‌های هوش مصنوعی.",
  applicationName: "ProAI",
  keywords: ["هوش مصنوعی", "پرامپت", "مهارت", "جامعه متن‌باز", "ProAI"],
  authors: [{ name: "ProAI Community" }],
  creator: "ProAI",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: "ProAI — هاب هوش مصنوعی",
    description: "پرامپت‌ها را بسازید، بهتر کنید و دانش جمعی هوش مصنوعی را توسعه دهید.",
    siteName: "ProAI",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07090f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa-IR" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
