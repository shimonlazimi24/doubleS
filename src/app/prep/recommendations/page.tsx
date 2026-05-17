import { redirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

export default function PrepRecommendationsPage() {
  redirect(`${PREP_BASE}/amirant/course/dashboard`);
}
