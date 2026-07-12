import { permanentRedirect } from "next/navigation";
import { AMIRANT_COURSE_HOME_PATH } from "@/lib/prep/amirant-continue";

/** שיעורי "learn" הישנים (תוכן דמו) הוחלפו בשיעורי הקורס האמיתי. */
export default function AmirantLessonPage() {
  permanentRedirect(AMIRANT_COURSE_HOME_PATH);
}
