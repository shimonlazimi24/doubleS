import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSimulation } from "@/lib/amirant-course";
import { Container } from "@/components/ui";
import { AmirantCourseSimulationClient } from "@/components/prep/amirant-course/AmirantCourseSimulationClient";

type Props = { params: { simId: string } };

export function generateMetadata({ params }: Props): Metadata {
  const s = getSimulation(params.simId);
  if (!s) return { title: "סימולציה" };
  return { title: `${s.title} | Amirant Preparation` };
}

export default function AmirantCourseSimulationPage({ params }: Props) {
  if (!getSimulation(params.simId)) notFound();
  return (
    <Container max="measureWide">
      <AmirantCourseSimulationClient simId={params.simId} />
    </Container>
  );
}
