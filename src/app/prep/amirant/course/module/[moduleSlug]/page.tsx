import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AMIRANT_PREPARATION_MANIFEST, displayModuleTitleHe, getManifestModuleBySlug } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";
import { AmirantModuleHub } from "@/components/prep/amirant-course/AmirantModuleHub";
import { isAmirantModuleFree } from "@/lib/prep/course-access";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

type Props = { params: { moduleSlug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const mod = getManifestModuleBySlug(params.moduleSlug);
  if (!mod) return { title: "מודול" };
  return { title: `${displayModuleTitleHe(mod)} | הכנה לאמירנט` };
}

export default async function AmirantCourseModulePage({ params }: Props) {
  const gateModule = getManifestModuleBySlug(params.moduleSlug);
  if (gateModule && !isAmirantModuleFree(gateModule)) {
    await requireAmirantFullAccess(gateModule.slug);
  }
  const mod = getManifestModuleBySlug(params.moduleSlug);
  if (!mod) notFound();
  return (
    <Container max="measureWide">
      <div>
        <AmirantModuleHub module={mod} manifest={AMIRANT_PREPARATION_MANIFEST} courseBase={COURSE_BASE} />
      </div>
    </Container>
  );
}
