import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantAdaptiveSimulationClient } from "@/components/prep/amirant-course/AmirantAdaptiveSimulationClient";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";
import { createPrepSupabaseServerClient, getPrepServerUser } from "@/lib/prep/supabase/server";
import { getAdaptiveAttemptStore } from "@/lib/amirant-course/simulations/adaptive/attempts.server";

export const metadata: Metadata = { title: "סימולציה אדפטיבית | הכנה לאמירנט" };

export default async function AdaptiveSimulationPage() {
  await requireAmirantFullAccess("full-simulations");
  const client = createPrepSupabaseServerClient();
  const { user } = await getPrepServerUser();
  const { store, persistent } = getAdaptiveAttemptStore(client, user?.id ?? null);
  const attempts = await store.listAttempts().catch(() => []);
  return (
    <Container max="measureWide" className="py-6">
      <AmirantAdaptiveSimulationClient attempts={attempts} persistent={persistent} />
    </Container>
  );
}
