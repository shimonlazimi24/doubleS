import { permanentRedirect } from "next/navigation";
import { AMIRANT_COURSE_HOME_PATH } from "@/lib/prep/amirant-continue";

/** חוויית "learn" הישנה (תוכן דמו + התקדמות מדומה) הוחלפה בקורס האמיתי. */
export default function AmirantLearnHomePage() {
  permanentRedirect(AMIRANT_COURSE_HOME_PATH);
}
