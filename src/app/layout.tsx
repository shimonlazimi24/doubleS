import type { Metadata } from "next";
import { Assistant, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Assistant({
  subsets: ["latin", "latin-ext", "hebrew"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const display = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "prePare — הכנה למבחני אנגלית",
  description: "prePare — הכנה ממוקדת למבחני אנגלית: אמירנט (פעיל) ו-TOEFL (בקרוב).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${display.variable} min-h-screen bg-canvas font-sans text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
