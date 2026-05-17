import type { Metadata } from "next";
import { PrepAmirantHub } from "@/components/prep/amirant-hub/PrepAmirantHub";
import { AMIRANT_COURSE_SYLLABUS_META } from "@/lib/prep/amirant-course-syllabus";

export const metadata: Metadata = {
  title: "אמירנט — מידע, מבוא ומבחן לדוגמה",
  description: `${AMIRANT_COURSE_SYLLABUS_META.shortNoteHe} מידע על המבחן, מבוא לקורס ההכנה, ומבחן דוגמה קצר לפני המסלול המלא.`,
};

export default function AmirantHubPage() {
  return <PrepAmirantHub />;
}
