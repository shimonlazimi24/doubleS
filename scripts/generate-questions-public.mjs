#!/usr/bin/env node
/**
 * Regenerates questions.public.json from questions.json.
 * Run after content ingest: node scripts/generate-questions-public.mjs
 *
 * The public file is bundled into the browser, so it leaves out:
 *   - the answer key and every explanation
 *   - the content owner's private index (solving method, theme, top-tier
 *     marker). That index is headed "for owners, not for learners"; it stays in
 *     questions.json, which only the server reads.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "content/amirant-import/source/questions.json");
const dest = path.join(root, "content/amirant-import/source/questions.public.json");

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.questions || [];
/** Mirrors `isOwnerIndexTag` in src/lib/amirant-course/question-bank/reserved-tags.ts. */
const isOwnerIndexTag = (tag) =>
  tag.startsWith("method:") || tag.startsWith("theme:") || tag.startsWith("owner-status:") || tag === "l6-top";

function strip(q) {
  const { correctOptionId, correct_option_id, explanation, distractorExplanations, ...rest } = q;
  if (Array.isArray(rest.tags)) rest.tags = rest.tags.filter((t) => !isOwnerIndexTag(t));
  return rest;
}
const out = Array.isArray(raw) ? arr.map(strip) : { ...raw, questions: (raw.questions || arr).map(strip) };
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`Wrote ${Array.isArray(out) ? out.length : (out.questions || []).length} public questions → ${dest}`);
