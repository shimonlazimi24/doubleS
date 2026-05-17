import Image from "next/image";
import type { ReactNode } from "react";
import { ButtonLink, Container, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { heroPadding } from "@/lib/design-system/spacing";
import { PREP_BRAND_NAV_HE, PREP_BRAND_TAGLINE_HE } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { PrepBrandLogo } from "@/components/prep/PrepBrandLogo";
import { STITCH_HOME_HERO } from "@/lib/prep/stitch-home-assets";

const HERO_PILLS = ["אמירנט — פעיל", "TOEFL — בקרוב", "משוב ממוקד"] as const;

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-surface-low px-ds-2 py-ds-1 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

export function PrepHomeHero() {
  return (
    <section className="relative flex min-h-[min(86vh,840px)] items-center overflow-hidden bg-paper">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 bg-paper/90" aria-hidden />
        <Image
          src={STITCH_HOME_HERO}
          alt=""
          fill
          priority
          className="object-cover opacity-[0.35] grayscale"
          sizes="100vw"
        />
      </div>

      <Container className={cn("relative z-[12]", heroPadding)}>
        <PrepBrandLogo size="hero" priority className="mb-ds-4" />
        <Text as="p" variant="eyebrow" className="mb-ds-4 max-w-readable">
          {PREP_BRAND_NAV_HE}
        </Text>

        <Heading level={1} preset="hero" className="max-w-4xl">
          הכנה ממוקדת ל<span className="text-primary">מבחני אנגלית</span>
        </Heading>

        <Text as="p" variant="bodyLg" className="mt-ds-6 max-w-2xl">
          {PREP_BRAND_TAGLINE_HE}
        </Text>

        <div className="mt-ds-4 flex flex-wrap gap-ds-2">
          {HERO_PILLS.map((label) => (
            <Pill key={label}>{label}</Pill>
          ))}
        </div>

        <div className="mt-ds-8 flex flex-wrap items-center gap-ds-3">
          <ButtonLink href={`${PREP_BASE}/amirant`} variant="primary" className="px-ds-4 py-ds-3 text-base">
            התחילו באמירנט
          </ButtonLink>
          <ButtonLink href={`${PREP_BASE}#limudim`} variant="secondary" className="px-ds-4 py-ds-3 text-base">
            לכל ההכנות
          </ButtonLink>
          <ButtonLink href={`${PREP_BASE}/login`} variant="ghost">
            התחברות
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
