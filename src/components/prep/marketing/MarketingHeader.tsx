"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/prep/marketing/BrandWordmark";
import { MarketingNav } from "@/components/prep/marketing/MarketingNav";
import { Container } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";

export function MarketingHeader() {
  const pathname = usePathname() ?? "";
  // Inside the course the course layout renders its own app-mode header
  if (pathname.startsWith(`${PREP_BASE}/amirant/course`)) return null;

  return (
    <header className="sticky top-0 z-[100] border-b border-line/60 bg-paper/90 shadow-nav backdrop-blur-lg">
      <Container
        dir="ltr"
        className="flex min-h-[4rem] items-center justify-between gap-8 py-3"
      >
        <Link
          href={PREP_BASE}
          className="shrink-0 transition-opacity hover:opacity-85"
          aria-label="PREPARE - דף הבית"
        >
          <BrandWordmark size="sm" showEnLine={false} />
        </Link>
        <MarketingNav />
      </Container>
    </header>
  );
}
