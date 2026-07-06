/**
 * מחולל שאלות אוצר מילים אמיתיות מתוך רשימות המילים של הקורס (2,000+ מילים
 * עם הגדרה, תרגום ודוגמאות) — מחליף את 30 שאלות הדמו הסינתטיות בחידוני
 * אוצר המילים.
 *
 * פורמט אחד בלבד — meaning: "What is the meaning of X?" עם התרגום הנכון +
 * 3 תרגומים של מילים אחרות מאותה רמה. הפורמט חסין דו-משמעות מבנית (תרגומים
 * שונים זה מזה), בניגוד ל-context-blank שבו כמה מילים יכולות להתאים למשפט.
 *
 * מסיחים: מילים מאותו קובץ (אותו סוג + רמה), עם תרגום שונה לחלוטין.
 * הסבר: ההגדרה + התרגום + משפט הדוגמה — ישירות מהחומר.
 *
 * אידמפוטנטי (מדלג על מזהים קיימים). הרצה: node scripts/generate-vocab-questions.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VOCAB_DIR = path.join(ROOT, "content/amirnet-course/03_vocabulary");
const QUESTIONS_JSON = path.join(ROOT, "content/amirant-import/source/questions.json");

const PER_FILE = 10;

const FILES = [
  { file: "vocabulary_1_easy_part_a_verbs.md", kind: "verbs", difficulty: 1 },
  { file: "vocabulary_1_easy_part_b_nouns.md", kind: "nouns", difficulty: 1 },
  { file: "vocabulary_1_easy_part_c_adjectives.md", kind: "adjectives", difficulty: 2 },
  { file: "vocabulary_1_easy_part_d_adverbs_connectives.md", kind: "adverbs", difficulty: 2 },
  { file: "vocabulary_2_intermediate_part_a_verbs.md", kind: "verbs", difficulty: 3 },
  { file: "vocabulary_2_intermediate_part_b_nouns.md", kind: "nouns", difficulty: 3 },
  { file: "vocabulary_2_intermediate_part_c_adjectives.md", kind: "adjectives", difficulty: 3 },
  { file: "vocabulary_2_intermediate_part_d_adverbs_connectives.md", kind: "adverbs", difficulty: 3 },
  { file: "vocabulary_3_advanced_part_a_verbs.md", kind: "verbs", difficulty: 4 },
  { file: "vocabulary_3_advanced_part_b_nouns.md", kind: "nouns", difficulty: 4 },
  { file: "vocabulary_3_advanced_part_c_adjectives.md", kind: "adjectives", difficulty: 4 },
  { file: "vocabulary_3_advanced_part_d_adverbs_connectives.md", kind: "adverbs", difficulty: 4 },
  { file: "vocabulary_4_expert_part_a_verbs.md", kind: "verbs", difficulty: 5 },
  { file: "vocabulary_4_expert_part_b_nouns.md", kind: "nouns", difficulty: 5 },
  { file: "vocabulary_4_expert_part_c_adjectives.md", kind: "adjectives", difficulty: 5 },
  { file: "vocabulary_4_expert_part_d_adverbs_connectives.md", kind: "adverbs", difficulty: 5 },
  { file: "vocabulary_phrasal_verbs.md", kind: "phrasal", difficulty: 3 },
  { file: "vocabulary_advanced_connectives.md", kind: "adverbs", difficulty: 5 },
  { file: "vocabulary_5_mastery_level.md", kind: "verbs", difficulty: 6 },
];

/** PRNG דטרמיניסטי — אותן שאלות בכל הרצה (יציבות מזהים). */
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** מפרק ערכי מילים: ### N. **word** (pos) + שדות bullet. */
function parseEntries(text) {
  const entries = [];
  const re = /^###\s+\d+\.\s+\*\*([^*]+)\*\*[^\n]*\n([\s\S]*?)(?=^###\s|^##\s|^#\s|$(?![\s\S]))/gim;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[1].trim();
    const body = m[2];
    const def = body.match(/\*\*Definition:?\*\*:?\s*([^\n]+)/i)?.[1]?.trim();
    const translation = body.match(/\*\*תרגום:?\*\*:?\s*([^\n]+)/)?.[1]?.trim();
    const example = body.match(/\*\*Example\s*1:?\*\*:?\s*([^\n]+)/i)?.[1]?.trim();
    if (!word || !translation || !def) continue;
    entries.push({ word, def, translation, example: example ?? null });
  }
  return entries;
}

function cleanExample(example) {
  return example.replace(/\*\*/g, "");
}

function distinctTranslations(a, b) {
  const x = a.replace(/[,;].*$/, "").trim();
  const y = b.replace(/[,;].*$/, "").trim();
  if (!x || !y) return false;
  return !x.includes(y) && !y.includes(x);
}

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * אורכי אופציות מאוזנים: פער אורכים קיצוני (יחס ≥3.2 במילים) הופך את
 * האלימינציה לטריוויאלית — מסיחים נבחרים באורך דומה לתרגום הנכון.
 */
function lengthsBalanced(candidates, target) {
  const lens = [...candidates, target].map((e) => wordCount(e.translation)).filter((n) => n > 0);
  if (lens.length < 2) return true;
  return Math.max(...lens) / Math.min(...lens) < 3.2;
}

function pickDistractors(entries, target, count, rng) {
  const pool = entries.filter(
    (e) => e.word !== target.word && distinctTranslations(e.translation, target.translation),
  );
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < count && guard++ < 400 && pool.length >= count) {
    const cand = pool[Math.floor(rng() * pool.length)];
    if (used.has(cand.word)) continue;
    if (out.some((o) => !distinctTranslations(o.translation, cand.translation))) continue;
    // איזון אורכים — אחרי 250 ניסיונות מרפים כדי לא להיתקע על מילים חריגות
    if (guard < 250 && !lengthsBalanced([...out, cand], target)) continue;
    used.add(cand.word);
    out.push(cand);
  }
  return out.length === count ? out : null;
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const existing = JSON.parse(fs.readFileSync(QUESTIONS_JSON, "utf8"));
const existingIds = new Set(existing.map((q) => q.questionId));

let totalAdded = 0;
for (const spec of FILES) {
  const filePath = path.join(VOCAB_DIR, spec.file);
  if (!fs.existsSync(filePath)) {
    console.warn("missing file:", spec.file);
    continue;
  }
  const entries = parseEntries(fs.readFileSync(filePath, "utf8"));
  if (entries.length < 8) {
    console.warn(spec.file, "— only", entries.length, "parseable entries, skipping");
    continue;
  }
  const rng = mulberry32(spec.file.length * 7919 + spec.difficulty);
  const levelSlug = spec.file.replace(/\.md$/, "").replace(/_/g, "-");
  // פיזור לאורך הקובץ: כל קבוצה של entries.length/PER_FILE מילים תורמת שאלה
  const step = Math.max(1, Math.floor(entries.length / PER_FILE));
  let added = 0;

  for (let i = 0; i < entries.length && added < PER_FILE; i += step) {
    const target = entries[i];
    const id = `vocab-${levelSlug}-q${added + 1}`;
    if (existingIds.has(id)) {
      added++;
      continue;
    }
    const distractors = pickDistractors(entries, target, 3, rng);
    if (!distractors) continue;

    // meaning: אופציות = תרגומים לעברית (חסין דו-משמעות)
    const questionText = `What is the meaning of the word "${target.word}"?`;
    const options = shuffle(
      [
        { word: target.translation, correct: true },
        ...distractors.map((d) => ({ word: d.translation, correct: false })),
      ],
      rng,
    ).map((o, idx) => ({ id: "abcd"[idx], label: o.word, correct: o.correct }));
    const correctOptionId = options.find((o) => o.correct).id;

    const explanationParts = [
      `**${target.word}** = ${target.translation}`,
      target.def ? `**Definition:** ${target.def}` : null,
      target.example ? `**Example:** ${cleanExample(target.example)}` : null,
    ].filter(Boolean);

    existing.push({
      questionId: id,
      topic: "vocabulary",
      subtopic: `vocab-${spec.kind}-${spec.difficulty}`,
      difficultyLevel: spec.difficulty,
      questionText,
      options: options.map(({ id: oid, label }) => ({ id: oid, label })),
      correctOptionId,
      explanation: explanationParts.join("\n\n"),
      distractorExplanations: {},
      estimatedTimeSec: 40,
      tags: [
        "imported",
        "generated_from_course_vocab",
        `vocab-quiz-${levelSlug}`,
        "vocabulary",
        `difficulty_${spec.difficulty}`,
      ],
    });
    existingIds.add(id);
    added++;
    totalAdded++;
  }
  console.log(`${spec.file}: ${entries.length} entries → ${added} questions`);
}

fs.writeFileSync(QUESTIONS_JSON, JSON.stringify(existing, null, 2) + "\n", "utf8");
console.log(`total added: ${totalAdded}, bank now: ${existing.length}`);
