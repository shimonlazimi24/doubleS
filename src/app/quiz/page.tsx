import { redirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

export default function LegacyQuizPage() {
  redirect(`${PREP_BASE}/amirant/course`);
}
