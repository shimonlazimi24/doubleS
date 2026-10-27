/**
 * Pulls the final-report copy out of the pool document (part א §6): the
 * disclaimer bullets, the band table ("מה זה אומר"), each band's "מה לשמר" /
 * "מה לשפר" / "הצעד הבא" lists, and the per-section notes by strength.
 *
 * Input: the document's plain text (the .docx's word/document.xml with tags
 * stripped, one paragraph per line). Output:
 * content/amirant-import/owner/simulation-pool/report.json, which the adaptive
 * report renders verbatim. The copy is wave-independent.
 *
 * Usage: node scripts/simulation-pool/parse-report-doc.mjs <doc.txt>
 */
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/simulation-pool/parse-report-doc.mjs <doc.txt>");
  process.exit(2);
}
const OUT = path.join(process.cwd(), "content/amirant-import/owner/simulation-pool/report.json");
const lines = fs.readFileSync(src, "utf8").split("\n").map((l) => l.replace(/\s+$/, ""));
const fail = (m) => {
  console.error(m);
  process.exit(1);
};
const bullet = (l) => l.replace(/^•\s*/, "").trim();

const start = lines.findIndex((l) => /^6\. התוצאה הסופית/.test(l));
if (start < 0) fail("section 6 not found");

// Disclaimers: the bullets right after the heading.
const disclaimersHe = [];
let i = start + 1;
for (; i < lines.length && lines[i].startsWith("•"); i++) disclaimersHe.push(bullet(lines[i]));

// Band table: "ציון" / "רמה" / "מה זה אומר" then triples.
while (i < lines.length && lines[i].trim() !== "ציון") i++;
i += 3;
const bands = [];
while (i + 2 < lines.length && /^\d+–\d+$/.test(lines[i].trim())) {
  const [min, max] = lines[i].trim().split("–").map(Number);
  bands.push({ min, max, labelHe: lines[i + 1].trim(), meaningHe: lines[i + 2].trim(), summaryHe: "", summaryEn: "", keepHe: [], improveHe: [], nextHe: [] });
  i += 3;
}
if (bands.length !== 6) fail(`${bands.length} bands in the table`);

// Per-band blocks: "50–69 · טרום בסיסי א'".
const sectionNotesStart = lines.findIndex((l, k) => k > i && l.trim() === "הערות לפי סוג פרק");
for (; i < sectionNotesStart; i++) {
  const m = lines[i].match(/^(\d+)–(\d+) · (.+)$/);
  if (!m) continue;
  const band = bands.find((b) => b.min === Number(m[1]) && b.max === Number(m[2]));
  if (!band) fail(`unknown band ${lines[i]}`);
  band.summaryHe = lines[i + 1].trim();
  band.summaryEn = lines[i + 2].trim();
  let k = i + 3;
  let target = null;
  for (; k < sectionNotesStart && lines[k].trim() !== ""; k++) {
    const t = lines[k].trim();
    if (t === "מה לשמר") target = band.keepHe;
    else if (t === "מה לשפר") target = band.improveHe;
    else if (t === "הצעד הבא") target = band.nextHe;
    else if (t.startsWith("•") && target) target.push(bullet(t));
  }
  i = k;
}
for (const b of bands) {
  if (!b.keepHe.length || !b.improveHe.length || !b.nextHe.length) fail(`band ${b.min}–${b.max} is missing a list`);
}

// Section notes: a header sentence, the column headers, then 5 lines per section type.
const TYPE_BY_HE = {
  "השלמת משפטים": "sentence_completion",
  "הבנת הנקרא": "reading_set",
  "ניסוח מחדש": "restatement",
  "האזנה (הרצאה או שיחה)": "listening_lecture",
  "יצירת מילה": "word_formation",
  "מטלת כתיבה": "writing_task",
};
let j = sectionNotesStart + 1;
const sectionNotesIntroHe = lines[j].trim();
j += 1;
while (j < lines.length && ["פרק", "חזק", "בינוני", "חלש", "שיטה מומלצת"].includes(lines[j].trim())) j++;
const sectionNotes = [];
while (j + 4 < lines.length && TYPE_BY_HE[lines[j].trim()]) {
  sectionNotes.push({
    type: TYPE_BY_HE[lines[j].trim()],
    labelHe: lines[j].trim(),
    strongHe: lines[j + 1].trim(),
    midHe: lines[j + 2].trim(),
    weakHe: lines[j + 3].trim(),
    methodHe: lines[j + 4].trim(),
  });
  j += 5;
}
if (sectionNotes.length !== 6) fail(`${sectionNotes.length} section notes`);

const thresholds = sectionNotesIntroHe.match(/חזק \((\d+)%[^)]*\).*בינוני \((\d+)/);
const report = {
  disclaimersHe,
  bands,
  sectionNotes,
  sectionNotesIntroHe,
  /** Strong from this accuracy, mid from the second; below is weak. */
  sectionThresholds: thresholds ? { strong: Number(thresholds[1]) / 100, mid: Number(thresholds[2]) / 100 } : { strong: 0.75, mid: 0.5 },
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`report.json: ${disclaimersHe.length} disclaimers, ${bands.length} bands, ${sectionNotes.length} section notes, thresholds ${JSON.stringify(report.sectionThresholds)}`);
