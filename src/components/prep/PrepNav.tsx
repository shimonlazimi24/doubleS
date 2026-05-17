import Link from "next/link";
import { PREP_BRAND_LATIN } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { PrepCoursesDropdown } from "@/components/prep/PrepCoursesDropdown";
import { Container } from "@/components/ui";

/** אזור לחיצה נוח במובייל (≈44px) — מפחית טעויות לחיצה בין פריטים צפופים */
const navTap = "inline-flex min-h-[2.75rem] items-center";

export function PrepNav() {
  return (
    <header className="sticky top-0 z-[100] border-b border-line/80 bg-paper shadow-nav">
      <Container className="flex flex-wrap items-center justify-between gap-ds-3 py-ds-2">
        <Link
          href={PREP_BASE}
          className={`${navTap} text-lg font-semibold tracking-tight text-primary transition hover:text-primary-hover`}
        >
          {PREP_BRAND_LATIN}
        </Link>
        <nav aria-label="ניווט ראשי" className="flex flex-wrap items-center gap-x-6 gap-y-3 md:gap-x-8">
          <Link
            href={PREP_BASE}
            className={`${navTap} text-sm text-muted transition hover:text-primary`}
          >
            בית
          </Link>
          <Link
            href={`${PREP_BASE}/courses`}
            className={`${navTap} text-sm text-muted transition hover:text-primary`}
          >
            קורסים
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
