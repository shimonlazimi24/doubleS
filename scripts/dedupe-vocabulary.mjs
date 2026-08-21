/**
 * Removes a vocabulary word from the higher difficulty level when the same word,
 * in the same part of speech, already appears at a lower one.
 *
 * 89 words were taught twice: `destroy` sat in both "easy" and "advanced",
 * `review` in "easy" and "expert". A learner working up the levels re-learns
 * words they already covered, and the level labels stop meaning anything.
 *
 * The part of speech is part of the identity, not just the spelling. `hope` is a
 * legitimate entry as both a verb and a noun; a rule keyed on the word alone
 * flagged 111 items and would have deleted 22 valid ones.
 *
 * Only whole entries are removed — the block from its `### n. **word**` heading
 * up to the next heading. Definitions, examples and translations are never
 * edited. Headings are renumbered so the file stays readable.
 *
 * Usage: node scripts/dedupe-vocabulary.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "amirnet-course", "03_vocabulary");
const DRY_RUN = process.argv.includes("--dry-run");

const ENTRY_HEADING = /^###\s+(\d+)\.\s+\*\*(.+?)\*\*/;

function levelOf(file) {
  return (file.match(/^vocabulary_(\d)/) ?? [])[1] ?? null;
}

/** verbs / nouns / adjectives / adverbs_connectives / phrasal — part of the identity. */
function partOfSpeech(file) {
  const m = file.match(/part_[a-d]_([a-z_]+)\.md$/);
  if (m) return m[1];
  if (file.includes("phrasal")) return "phrasal";
  if (file.includes("connectives")) return "adverbs_connectives";
  return "other";
}

/** Splits a file into its entry blocks, keeping everything before the first one. */
function readEntries(file) {
  const lines = fs.readFileSync(path.join(DIR, file), "utf8").split("\n");
  const preamble = [];
  const entries = [];
  let current = null;

  for (const line of lines) {
    const m = line.match(ENTRY_HEADING);
    if (m) {
      if (current) entries.push(current);
      current = { word: m[2].trim(), lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
    else preamble.push(line);
  }
  if (current) entries.push(current);
  return { preamble, entries };
}

function main() {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("SAMPLE") && levelOf(f))
    .sort();

  // First pass: where does each (word, part of speech) first appear?
  const firstSeen = new Map();
  const parsed = new Map();
  for (const file of files) {
    const data = readEntries(file);
    parsed.set(file, data);
    const level = Number(levelOf(file));
    const pos = partOfSpeech(file);
    for (const entry of data.entries) {
      const key = `${entry.word.toLowerCase()}|${pos}`;
      const prev = firstSeen.get(key);
      if (!prev || level < prev.level) firstSeen.set(key, { level, file });
    }
  }

  // Second pass: drop entries that repeat a lower level.
  let removed = 0;
  const report = [];
  for (const file of files) {
    const { preamble, entries } = parsed.get(file);
    const level = Number(levelOf(file));
    const pos = partOfSpeech(file);

    const kept = entries.filter((entry) => {
      const key = `${entry.word.toLowerCase()}|${pos}`;
      const first = firstSeen.get(key);
      const isRepeat = first && first.level < level;
      if (isRepeat) {
        removed += 1;
        report.push(`${entry.word} (${pos}) — dropped from level ${level}, kept at ${first.level}`);
      }
      return !isRepeat;
    });

    if (kept.length === entries.length) continue;

    // Numbering runs continuously across the whole course — level 2 starts at
    // 501, not 1 — so renumbering restarts each file at its own original first
    // number and only closes the gaps left by removals.
    const startAt = Number(entries[0].lines[0].match(ENTRY_HEADING)[1]);
    const renumbered = kept.map((entry, i) => {
      const [heading, ...rest] = entry.lines;
      return [heading.replace(ENTRY_HEADING, `### ${startAt + i}. **${entry.word}**`), ...rest];
    });

    const out = [...preamble, ...renumbered.flat()].join("\n");
    if (!DRY_RUN) fs.writeFileSync(path.join(DIR, file), out);
    console.log(`  ${String(entries.length - kept.length).padStart(3)} removed  ${file}`);
  }

  console.log(`\nentries removed: ${removed}`);
  if (report.length) {
    console.log("\n" + report.slice(0, 15).join("\n"));
    if (report.length > 15) console.log(`… and ${report.length - 15} more`);
  }
  if (DRY_RUN) console.log("\nDry run — nothing written.");
}

main();
