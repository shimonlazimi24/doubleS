/**
 * Generates `src/lib/amirant-course/generated/course-manifest.json`.
 *
 * The manifest is course *structure* — module slugs, lesson ids and titles,
 * quiz shapes, practice-set question ids. A few dozen kilobytes. It used to be
 * derived at runtime from the authoring source, which meant every browser that
 * opened the course downloaded 2.8MB of lesson, question and retrieval JSON —
 * including all 526 answer keys — to compute it. See `manifest-source.ts`.
 *
 * Deriving it once, here, keeps the runtime import graph clean.
 * `manifest-drift.test.ts` rebuilds from source and fails if this file is stale,
 * so the generated copy cannot silently disagree with the content.
 *
 * Usage: node scripts/generate-course-manifest.mjs [--check]
 *   --check  exit non-zero if the file on disk is out of date; writes nothing
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = process.cwd();
const ENTRY = path.join(root, "src/lib/amirant-course/manifest-source.ts");
const DEST = path.join(root, "src/lib/amirant-course/generated/course-manifest.json");
const CHECK_ONLY = process.argv.includes("--check");

/**
 * The builder is TypeScript with `@/` path aliases and JSON imports, so it is
 * bundled to a single ESM file in a temp dir before being imported.
 */
async function buildManifest() {
  const outfile = path.join(
    fs.mkdtempSync(path.join(root, "node_modules/.cache-manifest-")),
    "manifest-source.mjs",
  );
  await esbuild.build({
    entryPoints: [ENTRY],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    logLevel: "silent",
    alias: { "@": path.join(root, "src") },
  });
  const mod = await import(pathToFileURL(outfile).href);
  fs.rmSync(path.dirname(outfile), { recursive: true, force: true });
  return mod.buildAmirantManifestFromSource();
}

function summarize(manifest) {
  const lessons = manifest.modules.reduce((n, m) => n + m.lessons.length, 0);
  const quizzes = manifest.modules.reduce((n, m) => n + m.quizzes.length, 0);
  const sets = manifest.modules.reduce((n, m) => n + m.practiceSets.length, 0);
  return `${manifest.modules.length} modules, ${lessons} lessons, ${quizzes} quizzes, ${sets} practice sets, ${manifest.simulations.length} simulations`;
}

async function main() {
  const manifest = await buildManifest();

  if (!manifest?.modules?.length) {
    console.error("Refusing to write: the builder returned no modules.");
    process.exit(1);
  }

  const next = `${JSON.stringify(manifest, null, 2)}\n`;
  const current = fs.existsSync(DEST) ? fs.readFileSync(DEST, "utf8") : null;

  if (CHECK_ONLY) {
    if (current === next) {
      console.log(`course-manifest.json is up to date (${summarize(manifest)}).`);
      return;
    }
    console.error(
      "course-manifest.json is stale. Run: node scripts/generate-course-manifest.mjs",
    );
    process.exit(1);
  }

  if (current === next) {
    console.log(`No change (${summarize(manifest)}).`);
    return;
  }

  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  fs.writeFileSync(DEST, next);
  console.log(
    `Wrote ${path.relative(root, DEST)} — ${summarize(manifest)}, ${(next.length / 1024).toFixed(0)} KB.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
