import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { PrepAnalyticsGate } from "@/components/prep/PrepAnalyticsGate";
import { PrepCookieConsentBanner } from "@/components/prep/PrepCookieConsent";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PREPARE - הכנה ללימודים אקדמיים",
  description: "PREPARE - הכנה ממוקדת למבחני אנגלית אקדמיים: אמירנט (פעיל) ו-TOEFL (בקרוב).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${inter.variable} min-h-screen bg-canvas font-sans text-ink antialiased`}
      >
        {children}
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <PrepAnalyticsGate gaId={process.env.NEXT_PUBLIC_GA_ID} />
        ) : null}
        <PrepCookieConsentBanner />
      </body>
    </html>
  );
}
