import { permanentRedirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

/** עמוד דמו-פרוטוטייפ ישן. הדמו החי מוטמע היום בעמוד האמירנט הראשי. */
export default function AmirantDemoPage() {
  permanentRedirect(`${PREP_BASE}/amirant`);
}
