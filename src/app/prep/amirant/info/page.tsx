import type { Metadata } from "next";
import Link from "next/link";
import { AmirantInfoBlocks } from "@/components/prep/amirant-info/AmirantInfoBlocks";
import { AmirantSyllabusPublic } from "@/components/prep/amirant-info/AmirantSyllabusPublic";
import { Container, Heading, PageLayout, Section, Text } from "@/components/ui";
import { AMIRANT_GENERAL_INFO_BLOCKS } from "@/lib/prep/amirant-general-info-blocks";
import { AMIRANT_NARRATIVE_BLOCKS } from "@/lib/prep/amirant-narrative-blocks";
import { AMIRANT_COURSE_SYLLABUS_META } from "@/lib/prep/amirant-course-syllabus";
import { PREP_BASE } from "@/lib/prep/constants";

export const metadata: Metadata = {
  title: "אמירנט - מידע כללי וסילבוס",
  description:
    "מבוא למבחן מאל״ו, מעבר מאמיר״ם לאמירנט, סולם ציונים, נהלים, הכנה ורפורמות - לצד סילבוס הקורס באפליקציה.",
};

export default function AmirantInfoPage() {
  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measureWide">
          <Link
            href={`${PREP_BASE}/amirant?tab=info`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה לאמירנט
          </Link>
          <Heading level={1} className="mt-ds-6">
            דף מידע כללי - אמירנט
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-ds-4 max-w-readable leading-relaxed text-muted">
            {AMIRANT_COURSE_SYLLABUS_META.shortNoteHe} למטה: סקירה מערכתית לפי המסמך שסיפקת, ואחריה עץ הסילבוס הטכני של קורס ההכנה במוצר.
          </Text>
        </Container>
      </PageLayout>

      <Section tone="canvas" padding="loose" className="border-t border-line/80">
        <Container max="measureWide">
          <AmirantInfoBlocks blocks={[...AMIRANT_GENERAL_INFO_BLOCKS, ...AMIRANT_NARRATIVE_BLOCKS]} />
          <AmirantSyllabusPublic />
        </Container>
      </Section>

      <Section tone="paper" padding="loose" className="border-t border-line/80">
        <Container max="measureWide" className="space-y-4">
          <Text as="p" variant="bodySm" className="text-muted">
            דפי מידע מעוצבים (מדריך, ציונים, רפורמה, טיפים, עלויות) זמינים כ־HTML סטטי - רשימה מלאה ו־Markdown של הקורס ב־
            <Link href={`${PREP_BASE}/amirant/materials`} className="font-semibold text-primary hover:underline">
              אינדקס החומרים
            </Link>
            .
          </Text>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`${PREP_BASE}/amirant/learn`}
              className="inline-flex rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover"
            >
              היכנסו לקורס
            </Link>
            <Link
              href={`${PREP_BASE}/amirant/materials`}
              className="inline-flex rounded-control border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-primary shadow-card hover:bg-surface-low"
            >
              אינדקס חומרים (Markdown + HTML)
            </Link>
            <Link
              href={`${PREP_BASE}/amirant/demo`}
              className="inline-flex rounded-control border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-primary shadow-card hover:bg-surface-low"
            >
              דמו מלא (מבנה + מבחן)
            </Link>
            <Link
              href={`${PREP_BASE}/amirant/practice`}
              className="inline-flex rounded-control border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-primary shadow-card hover:bg-surface-low"
            >
              תרגול / סימולציה
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
}
