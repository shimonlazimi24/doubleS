import { redirect } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";

export default function PrepDashboardPage() {
  redirect(`${PREP_BASE}/amirant/course/dashboard`);
}
