import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSimulation } from "@/lib/amirant-course";
import { Container } from "@/components/ui";
import { AmirantCourseSimulationClient } from "@/components/prep/amirant-course/AmirantCourseSimulationClient";
import { simulationPoolForClient } from "@/lib/amirant-course/question-bank/for-client.server";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

type Props = { params: { simId: string } };

export function generateMetadata({ params }: Props): Metadata {
  const s = getSimulation(params.simId);
  if (!s) return { title: "סימולציה" };
  return { title: `${s.title} | הכנה לאמירנט` };
}

export default async function AmirantCourseSimulationPage({ params }: Props) {
  await requireAmirantFullAccess("full-simulations");
  if (!getSimulation(params.simId)) notFound();
  // Each section is picked by topic and level in the browser from this pool
  // (ids, topics, levels, passage ids); the section's questions are then fetched by id.
  return (
    <Container max="measureWide">
      <AmirantCourseSimulationClient simId={params.simId} pool={simulationPoolForClient()} />
    </Container>
  );
}
