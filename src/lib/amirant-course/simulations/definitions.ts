/**
 * Applies the authoring source's simulation blueprints over the derived ones.
 *
 * **Build-time only — never import this from application code.** It reaches
 * `content-source/production-source` and its 2.8MB of JSON. Runtime code reads
 * the resolved simulations from the generated manifest instead:
 * `import { AMIRANT_SIMULATIONS } from "../manifest"`.
 *
 * This file is what `manifest-source.ts` uses when generating that manifest.
 */
import type { ManifestSimulation } from "../types/course-manifest";
import { getResolvedAmirantProductionContent } from "../content-source/resolved-content";
import { DEMO_SIMULATIONS } from "./blueprint";

export { AMIRANT_SIMULATION_COUNT } from "./blueprint";

const imported = getResolvedAmirantProductionContent();

export const AMIRANT_SIMULATIONS: ManifestSimulation[] = imported?.simulationBlueprints.length
  ? imported.simulationBlueprints
  : DEMO_SIMULATIONS;
