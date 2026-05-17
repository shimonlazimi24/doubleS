import Link from "next/link";
import { BrandWordmark } from "@/components/prep/marketing/BrandWordmark";
import { PrepCoursesDropdown } from "@/components/prep/PrepCoursesDropdown";
import { Container } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";

const navTap = "inline-flex min-h-[2.75rem] items-center";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-[100] border-b border-line/80 bg-paper/95 shadow-nav backdrop-blur-md">
      <Container
        dir="ltr"
        className="flex min-h-[3.75rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2"
      >
        <Link
          href={PREP_BASE}
          className={`${navTap} shrink-0 transition hover:opacity-90`}
          aria-label="prePare — דף הבית"
        >
          <BrandWordmark size="sm" />
        </Link>

        <nav
          dir="rtl"
          aria-label="ניווט ראשי"
          className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-5 gap-y-2 md:gap-x-7"
        >
          <Link href={PREP_BASE} className={`${navTap} text-sm text-muted transition hover:text-primary`}>
            בית
          </Link>
          <PrepCoursesDropdown />
          <Link
            href={`${PREP_BASE}/pricing`}
            className={`${navTap} text-sm text-muted transition hover:text-primary`}
          >
            מחירון
          </Link>
          <Link
            href={`${PREP_BASE}/about`}
            className={`${navTap} text-sm text-muted transition hover:text-primary`}
          >
            אודות
          </Link>
          <Link
            href={`${PREP_BASE}/login`}
            className={`${navTap} text-sm font-semibold text-primary transition hover:text-primary-hover`}
          >
            התחברות
          </Link>
        </nav>
      </Container>
    </header>
  );
}
