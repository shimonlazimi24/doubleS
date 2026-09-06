/**
 * Fails if the built browser bundle contains things that must never leave the
 * server, or if any single chunk is large enough to stall a phone.
 *
 * This exists because the course manifest used to be derived at runtime from the
 * authoring source. That pulled `questions.json` into a page chunk, so
 * `.next/static/chunks/4852-*.js` shipped 2.5MB to every visitor — with all 526
 * `correctOptionId` values in it. Anyone could read the answer key from devtools
 * without paying, and every navigation paid to parse it.
 *
 * A comment in the barrel asking people not to do that had been there the whole
 * time. This is the version that fails the build instead.
 *
 * Usage: node scripts/check-client-chunks.mjs   (after `next build`)
 */
import fs from "node:fs";
import path from "node:path";

const CHUNK_DIR = path.join(process.cwd(), ".next/static/chunks");

/**
 * Patterns that prove server-only *data* reached the browser.
 *
 * These match the JSON-serialised shape — key, colon, quoted value — not the
 * bare identifier. Grading and answer-logging code legitimately reads
 * `q.correctOptionId` after the server has graded, and that property access is
 * in every quiz page chunk. What must never appear is the bank itself:
 * `"correctOptionId":"b"`, five hundred times over.
 */
const FORBIDDEN = [
  {
    pattern: /correctOptionId"?\s*:\s*"[a-z0-9]/g,
    why: "question answer keys (questions.json)",
  },
  {
    pattern: /amirnetMarkdownRel"?\s*:\s*"/g,
    why: "the lesson registry (lessons.json)",
  },
  {
    pattern: /SUPABASE_SERVICE_ROLE_KEY/g,
    why: "the service-role key name",
  },
];

/**
 * No single browser chunk may exceed this. The offending chunk was 2482KB;
 * the next largest legitimate one is ~330KB, so this leaves real headroom while
 * still catching a whole content package being pulled back in.
 */
const MAX_CHUNK_KB = 600;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.name.endsWith(".js") ? [full] : [];
  });
}

function main() {
  const files = walk(CHUNK_DIR);
  if (files.length === 0) {
    console.error(`No chunks in ${path.relative(process.cwd(), CHUNK_DIR)}. Run \`npm run build\` first.`);
    process.exit(2);
  }

  const failures = [];
  let largest = { name: "", kb: 0 };

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const kb = Math.round(fs.statSync(file).size / 1024);
    if (kb > largest.kb) largest = { name: path.basename(file), kb };
    if (kb > MAX_CHUNK_KB) {
      failures.push(`${rel} is ${kb}KB — over the ${MAX_CHUNK_KB}KB limit for a browser chunk.`);
    }

    const source = fs.readFileSync(file, "utf8");
    for (const { pattern, why } of FORBIDDEN) {
      const hits = source.match(pattern)?.length ?? 0;
      if (hits > 0) {
        failures.push(`${rel} contains ${pattern.source} x${hits} — ${why} must not reach the browser.`);
      }
    }
  }

  console.log(`Checked ${files.length} chunks. Largest: ${largest.name} (${largest.kb}KB).`);

  if (failures.length === 0) {
    console.log("No server-only content in the browser bundle.");
    return;
  }

  console.error(`\n${failures.length} problem${failures.length === 1 ? "" : "s"}:\n`);
  for (const line of failures) console.error(`  ${line}`);
  console.error(
    "\nUsually this means a client component imported `@/lib/amirant-course`'s heavy" +
      "\nneighbours. Import `./manifest` (generated, 31KB) and" +
      "\n`./question-bank/client-bank` (no answers) instead.",
  );
  process.exit(1);
}

main();
