/**
 * חילוץ קטעי קריאה (Reading Comprehension passages) ממסמכי התרגול אל
 * content/amirant-import/source/passages.json + שיוך passageId לשאלות RC
 * ב-questions.json (לפי סדר השאלה בקובץ המקור).
 *
 * הרצה: node scripts/extract-rc-passages.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const QUIZ_DIR = path.join(ROOT, "content/amirnet-course/06_reading_comprehension/practice_quizzes");
const SIM_FILE = path.join(ROOT, "content/amirnet-course/08_full_simulations/simulation_1_baseline.md");
const QUESTIONS_JSON = path.join(ROOT, "content/amirant-import/source/questions.json");
const PASSAGES_JSON = path.join(ROOT, "content/amirant-import/source/passages.json");

/** reading_comp_quiz_1_easy.md → reading-comp-quiz-1-easy (תג הקבוצה בבנק) */
function fileToTag(fileName) {
  return path
    .basename(fileName, ".md")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/^reading-comp-quiz/, "reading-comp-quiz");
}

/** אוסף את גוף הקטע: שורות בלוקציטוט (>) עד לכותרת הבאה. */
function collectPassageBody(lines, startIdx) {
  const body = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{2,4}\s/.test(line)) break;
    body.push(line);
  }
  // מנקה מפרידי --- בקצוות ושורות ריקות עודפות
  return body
    .join("\n")
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseQuizFile(filePath, tag) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const passages = []; // {passageId, title, bodyMarkdown, sourceTag}
  const questionToPassage = new Map(); // qNum -> passageId
  let currentPassageId = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // עוצרים בחלק התשובות — שאלות אחריו הן העתקים בהסברים
    if (/^##\s.*(Answers|Answer Key|תשובות)/i.test(line)) break;

    const passageHeader =
      line.match(/^##\s+📖\s*Passage\s*(\d*)\s*:?\s*(.*)$/) ??
      line.match(/^##\s+📖\s*(The Passage)\s*(.*)$/) ??
      line.match(/^##\s+Part 1: The Passage.*$/);
    if (passageHeader) {
      const num = passages.length + 1;
      const title = (passageHeader[2] ?? "").trim();
      currentPassageId = `${tag}-p${num}`;
      passages.push({
        passageId: currentPassageId,
        title,
        bodyMarkdown: collectPassageBody(lines, i),
        sourceTag: tag,
      });
      continue;
    }

    const qHeader = line.match(/^###\s+Question\s+(\d+)/);
    if (qHeader && currentPassageId) {
      questionToPassage.set(Number(qHeader[1]), currentPassageId);
    }
  }
  return { passages, questionToPassage };
}

/** סימולציה 1: קטע אחד תחת "#### 📖 Passage:", שאלות Q9–Q13 בבנק. */
function parseSimulationPassage() {
  const text = fs.readFileSync(SIM_FILE, "utf8");
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => /^#{3,4}\s+📖\s*Passage\s*:?/.test(l));
  if (idx === -1) return null;
  const title = (lines[idx].match(/Passage\s*:?\s*(.*)$/)?.[1] ?? "").trim();
  const body = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{2,4}\s/.test(line) || /^\*\*Q\d+\./.test(line)) break;
    body.push(line);
  }
  return {
    passageId: "simulation-1-baseline-p1",
    title,
    bodyMarkdown: body.join("\n").replace(/^\s*---\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim(),
    sourceTag: "simulation-1-baseline",
  };
}

const allPassages = [];
const assignment = new Map(); // questionId -> passageId

for (const fileName of fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith(".md"))) {
  if (fileName.startsWith("SAMPLE")) continue; // אין שורות בנק לקובץ הדוגמה
  const tag = fileToTag(fileName);
  const { passages, questionToPassage } = parseQuizFile(path.join(QUIZ_DIR, fileName), tag);
  allPassages.push(...passages);
  for (const [qNum, passageId] of questionToPassage) {
    assignment.set(`${tag}-q${qNum}`, passageId);
  }
}

const simPassage = parseSimulationPassage();
if (simPassage) {
  allPassages.push(simPassage);
  for (let q = 9; q <= 13; q++) {
    assignment.set(`simulation-1-baseline-q${q}`, simPassage.passageId);
  }
}

// שיוך לשאלות
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON, "utf8"));
let assigned = 0;
let rcTotal = 0;
for (const q of questions) {
  if (q.topic !== "reading_comprehension") continue;
  rcTotal++;
  const passageId = assignment.get(q.questionId);
  if (passageId) {
    q.passageId = passageId;
    assigned++;
  }
}

// ולידציה: כל קטע משויך חייב גוף לא ריק
const emptyBodies = allPassages.filter((p) => !p.bodyMarkdown);
if (emptyBodies.length) {
  console.error("Passages with empty body:", emptyBodies.map((p) => p.passageId));
  process.exit(1);
}

fs.writeFileSync(PASSAGES_JSON, JSON.stringify(allPassages, null, 2) + "\n", "utf8");
fs.writeFileSync(QUESTIONS_JSON, JSON.stringify(questions, null, 2) + "\n", "utf8");

const unassigned = [];
for (const q of questions) {
  if (q.topic === "reading_comprehension" && !q.passageId) unassigned.push(q.questionId);
}
console.log(`passages: ${allPassages.length}, RC questions: ${rcTotal}, assigned: ${assigned}`);
if (unassigned.length) console.log("unassigned:", unassigned);
