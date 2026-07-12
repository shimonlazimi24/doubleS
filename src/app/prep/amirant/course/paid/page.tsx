import { permanentRedirect } from "next/navigation";
import { AMIRANT_COURSE_HOME_PATH } from "@/lib/prep/amirant-continue";

/** עמוד "paid" ישן ללא קישורים נכנסים - תוכנית הקורס חיה בעמוד הקורס הראשי. */
export default function AmirantCoursePaidPage() {
  permanentRedirect(AMIRANT_COURSE_HOME_PATH);
}
