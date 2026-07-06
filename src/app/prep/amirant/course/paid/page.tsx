import type { Metadata } from "next";
import Link from "next/link";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";
import { AmirantCourseProgramHeader } from "@/components/prep/amirant-course/AmirantCourseProgramHeader";
import { AmirantCourseModuleGrid } from "@/components/prep/amirant-course/AmirantCourseModuleGrid";

const PROGRAM_INTRO =
  "לפי סילבוס אמירם: מבוא (מבחן, ציונים, התאמה אקדמית, הכנה, שימוש בקורס ולו״ז); מילון מושגים; שלושת מיומנויות הליבה במבנה אחיד; פיילוט 2026; מבחני סימולציה מלאים; טיפים; וסיכום עם שאלון, פידבק והמשך — לצד תרגול, מבחנים אדפטיביים ולוח.";

export const metadata: Metadata = {
  title: "הקורס בתשלום | הכנה לאמירנט",
  description: "מבנה המסלול, מודולים, והתקדמות — גישה מלאה אחרי רכישה (יוגבל בעתיד).",
};

export default function AmirantCoursePaidPage() {
  const m = AMIRANT_PREPARATION_MANIFEST;
  return (
    <Container max="measureWide">
      <div className="space-y-10">
        <AmirantCourseProgramHeader courseTitle="הכנה לאמירנט" oneLiner={PROGRAM_INTRO} />
        <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-ink">
          מודול המבוא פתוח לעיון. לגישה לכל המודולים, מבחנים ועוזר AI —{" "}
          <Link href={`${PREP_BASE}/pricing`} className="font-semibold text-primary underline-offset-2 hover:underline">
            רכישת הקורס המלא
          </Link>
          .
        </p>
        <AmirantCourseModuleGrid modules={m.modules} />
      </div>
    </Container>
  );
}
