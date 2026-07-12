import { permanentRedirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

/** עמוד מידע-פרוטוטייפ ישן (ניסוח פנימי + קישורים למסלולי דמו). המידע חי בעמוד האמירנט הראשי. */
export default function AmirantInfoPage() {
  permanentRedirect(`${PREP_BASE}/amirant`);
}
