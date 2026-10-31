import type { Metadata } from "next";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { AmirantCourseAccessProvider } from "@/components/prep/amirant-course/AmirantCourseAccessProvider";
import { AmirantCourseAssistantFrame } from "@/components/prep/amirant-course/assistant/AmirantCourseAssistantFrame";
import { AmirantCourseAssistantProvider } from "@/components/prep/amirant-course/assistant/AmirantCourseAssistantProvider";
import { AmirantCourseProgressProvider } from "@/components/prep/amirant-course/AmirantCourseProgressProvider";
import { AmirantExpiryBanner } from "@/components/prep/amirant-course/AmirantExpiryBanner";
import { AmirantPersistenceProvider } from "@/components/prep/amirant-course/AmirantPersistenceProvider";
import { CourseNav } from "@/components/prep/amirant-course/CourseNav";

export const metadata: Metadata = {
  title: "הכנה לאמירנט",
  description: AMIRANT_PREPARATION_MANIFEST.description,
};

/**
 * The layout does no data fetching. It used to resolve the user and their
 * entitlement here (two round trips to the database) just to decide whether
 * to show the assistant, and because a layout renders before its page, every
 * page under /course waited for that before its own loading state could show.
 * The assistant is gated in the browser (AmirantCourseAssistantProvider); the
 * tester entitlement moved to the lesson access gate. On wide screens the
 * assistant is a column beside the page (AmirantCourseAssistantFrame), so the
 * provider wraps the header too: its "עוזר" button lives there.
 */
export default function AmirantCourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AmirantPersistenceProvider>
      <AmirantCourseAccessProvider>
        <AmirantCourseProgressProvider>
          <AmirantCourseAssistantProvider>
            <div className="min-h-screen bg-paper">
              <CourseNav />
              <AmirantExpiryBanner />
              {/* Full-bleed children (e.g. lesson workspace). Narrow pages wrap themselves in <Container max="measureWide">. */}
              <AmirantCourseAssistantFrame>
                <div className="w-full max-w-none pb-24">{children}</div>
              </AmirantCourseAssistantFrame>
            </div>
          </AmirantCourseAssistantProvider>
        </AmirantCourseProgressProvider>
      </AmirantCourseAccessProvider>
    </AmirantPersistenceProvider>
  );
}
