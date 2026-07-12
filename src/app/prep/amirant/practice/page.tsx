import { permanentRedirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

/** מסלול תרגול-פרוטוטייפ ישן. המבחן לדוגמה מוטמע בעמוד האמירנט הראשי. */
export default function AmirantPracticePage() {
  permanentRedirect(`${PREP_BASE}/amirant#demo`);
}
