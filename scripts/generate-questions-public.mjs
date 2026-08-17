#!/usr/bin/env node
/**
 * Regenerates questions.public.json (no correctOptionId / explanation) from questions.json.
 * Run after content ingest: node scripts/generate-questions-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "content/amirant-import/source/questions.json");
const dest = path.join(root, "content/amirant-import/source/questions.public.json");

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.questions || [];
function strip(q) {
  const { correctOptionId, correct_option_id, explanation, distractorExplanations, ...rest } = q;
  return rest;
}
const out = Array.isArray(raw) ? arr.map(strip) : { ...raw, questions: (raw.questions || arr).map(strip) };
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`Wrote ${Array.isArray(out) ? out.length : (out.questions || []).length} public questions → ${dest}`);
