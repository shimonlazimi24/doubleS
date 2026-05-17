import { redirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

export default function LegacyLessonPage() {
  redirect(`${PREP_BASE}/amirant/course`);
}
