"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PrepBrandLogo } from "@/components/prep/PrepBrandLogo";
import { MarketingNav } from "@/components/prep/marketing/MarketingNav";
import { Container } from "@/components/ui";
import { PREP_BASE, isPrepAppChromePath } from "@/lib/prep/constants";

export function MarketingHeader() {
  const pathname = usePathname() ?? "";
  // Inside the course the course layout renders its own app-mode header
  if (isPrepAppChromePath(pathname)) return null;

  return (
    <header className="sticky top-0 z-[100] border-b border-line/60 bg-paper/90 shadow-nav backdrop-blur-lg">
      <Container dir="ltr" className="flex min-h-[4rem] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 lg:py-3">
        {/* No aria-label: the wordmark + Hebrew subtitle are the visible text and
            WCAG 2.5.3 wants the accessible name to contain it. */}
        <Link href={PREP_BASE} className="order-1 shrink-0 transition-opacity hover:opacity-85" title="דף הבית">
          <PrepBrandLogo size="nav" />
        </Link>
        <MarketingNav />
      </Container>
    </header>
  );
}
