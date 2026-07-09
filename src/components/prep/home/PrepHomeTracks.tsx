import Image from "next/image";
import Link from "next/link";
import { Container, Heading, Text } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import {
  STITCH_HOME_BENTO_LARGE,
  STITCH_HOME_BENTO_SMALL_A,
  STITCH_HOME_BENTO_SMALL_B,
} from "@/lib/prep/stitch-home-assets";

export function PrepHomeTracks() {
  return (
    <section id="limudim" className="bg-paper py-ds-12 md:py-ds-16">
      <Container>
        <div className="mb-ds-10 flex flex-col justify-between gap-ds-6 md:mb-ds-12 md:flex-row md:items-end">
          <div className="max-w-2xl text-start">
            <Text as="p" variant="labelAccent" className="mb-ds-2">
              מסלולים נבחרים
            </Text>
            <Heading level={2}>הקורסים והמסלולים המרכזיים</Heading>
          </div>
          <Link
            href={`${PREP_BASE}/blog`}
            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            לכל התכנים ←
          </Link>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-ds-4 md:grid-cols-12 md:gap-ds-5 md:[grid-template-rows:1fr_1fr] md:min-h-[600px] lg:min-h-[680px]">
          <Link
            href={`${PREP_BASE}/toefl`}
            className="group relative isolate min-h-[300px] overflow-hidden rounded-surface bg-surface-low shadow-card ring-1 ring-line/50 md:col-span-8 md:row-span-2 md:min-h-0"
          >
            <Image
              src={STITCH_HOME_BENTO_LARGE}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-ink/55 transition group-hover:bg-ink/50" aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-end p-ds-6 text-start text-paper md:p-ds-8">
              <Text as="p" variant="caption" className="mb-ds-2 font-semibold uppercase tracking-[0.12em] text-white/90">
                מסלול מלא
              </Text>
              <Heading as="p" level={2} className="text-paper md:text-4xl">
                TOEFL
              </Heading>
              <Text as="p" variant="bodyInverse" className="mt-ds-3 max-w-xl">
                מבנה, תזמון ומשוב ממוקד ציון - קריאה, כתיבה, דיבור והאזנה כמערכת אחת.
              </Text>
              <div className="mt-ds-6 flex flex-wrap items-center gap-ds-4">
                <span className="inline-flex rounded-control bg-paper px-ds-4 py-ds-2 text-sm font-semibold text-primary">
                  לפרטים והרשמה
                </span>
                <Text as="span" variant="bodyInverseMuted">
                  ~12 שבועות (דמו)
                </Text>
              </div>
            </div>
          </Link>

          <Link
            href={`${PREP_BASE}/amirant/course`}
            className="group relative min-h-[240px] overflow-hidden rounded-surface bg-surface-low shadow-card ring-1 ring-line/50 md:col-span-4 md:min-h-0"
          >
            <Image
              src={STITCH_HOME_BENTO_SMALL_A}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-paper/55 transition group-hover:bg-paper/40" aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-end p-ds-6 text-start">
              <Heading as="p" level={3}>
                אמירנט
              </Heading>
              <Text as="p" variant="bodySm" className="mt-ds-1 font-medium text-muted">
                קורס הכנה מלא
              </Text>
            </div>
          </Link>

          <Link
            href={`${PREP_BASE}/study-usa`}
            className="group relative min-h-[240px] overflow-hidden rounded-surface bg-surface-low shadow-card ring-1 ring-line/50 md:col-span-4 md:min-h-0"
          >
            <Image
              src={STITCH_HOME_BENTO_SMALL_B}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-primary-muted transition group-hover:bg-primary-muted/80" aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-end p-ds-6 text-start">
              <Heading as="p" level={3}>
                לימודים בארה״ב
              </Heading>
              <Text as="p" variant="bodySm" className="mt-ds-1 font-medium text-muted">
                10 מפגשים · הכנה אקדמית (דמו)
              </Text>
            </div>
          </Link>
        </div>
      </Container>
    </section>
  );
}
