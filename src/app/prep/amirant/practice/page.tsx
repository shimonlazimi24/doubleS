import type { Metadata } from "next";
import { AmirantPracticeFlow } from "@/components/prep/amirant-demo/AmirantPracticeFlow";

export const metadata: Metadata = {
  title: "אמירנט — מבחן מערכת (אדפטיבי)",
  description: "תרגול אדפטיבי מבוסס בנק השאלות של הדמו — ללא שאר מקטעי הדמו.",
};

/** מסלול מבחן בלבד (ללא דשבורד / אינטגרציות / צ׳אט של עמוד הדמו המלא). */
export default function AmirantPracticePage() {
  return <AmirantPracticeFlow />;
}
