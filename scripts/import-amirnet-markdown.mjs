import fs from "node:fs";
import path from "node:path";

const INPUT_ROOT = "/Users/shimon.lazimi/Downloads/AMIRNET Course";
const OUTPUT_ROOT = path.join(process.cwd(), "content", "amirant-import", "source");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function toSlug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMd(s) {
  return s
    .replace(/`+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .trim();
}

function mapModuleSlug(filePath) {
  if (filePath.includes("/01_welcome_and_intro/")) return "introduction";
  if (filePath.includes("/02_logistics_bureaucracy/")) return "introduction";
  if (filePath.includes("/03_vocabulary/")) return "vocabulary";
  if (filePath.includes("/04_sentence_completion/")) return "sentence-completion";
  if (filePath.includes("/05_restatement/")) return "sentence-rephrasing";
  if (filePath.includes("/06_reading_comprehension/")) return "reading-comprehension";
  if (filePath.includes("/07_new_reform_audio_writing/")) return "new-exam-format-2026";
  if (filePath.includes("/08_full_simulations/")) return "full-simulations";
  if (filePath.includes("/09_winning_tips/")) return "tips-strategies";
  if (filePath.includes("/10_summary_feedback/")) return "course-summary";
  return null;
}

function mapTopicFromPath(filePath) {
  if (filePath.includes("/03_vocabulary/")) return "vocabulary";
  if (filePath.includes("/04_sentence_completion/")) return "sentence_completion";
  if (filePath.includes("/05_restatement/")) return "rephrasing";
  if (filePath.includes("/06_reading_comprehension/")) return "reading_comprehension";
  return null;
}

function mapTopicFromHeader(line) {
  const lower = line.toLowerCase();
  if (lower.includes("sentence completion")) return "sentence_completion";
  if (lower.includes("restatement")) return "rephrasing";
  if (lower.includes("reading comprehension")) return "reading_comprehension";
  if (lower.includes("vocabulary")) return "vocabulary";
  return null;
}

function topicToModule(topic) {
  if (topic === "vocabulary") return "vocabulary";
  if (topic === "sentence_completion") return "sentence-completion";
  if (topic === "rephrasing") return "sentence-rephrasing";
  if (topic === "reading_comprehension") return "reading-comprehension";
  return "introduction";
}

function difficultyFromPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("easy")) return 2;
  if (lower.includes("intermediate")) return 3;
  if (lower.includes("mixed")) return 4;
  if (lower.includes("hard")) return 5;
  if (lower.includes("baseline")) return 3;
  if (lower.includes("warmup")) return 4;
  if (lower.includes("challenge")) return 5;
  if (lower.includes("final")) return 6;
  if (lower.includes("mastery")) return 6;
  if (lower.includes("diagnostic")) return 3;
  return 3;
}

function parseAnswerMap(markdown) {
  const map = new Map();
  const lines = markdown.split("\n");
  for (const line of lines) {
    const h = line.match(/(?:Question|Q)\s*(\d+).*Correct Answer:\s*\*\*\(([A-D])\)\*\*/i);
    if (h) {
      map.set(Number(h[1]), h[2].toLowerCase());
      continue;
    }
    const t = line.match(/^\|\s*(\d+)\s*\|\s*([A-D])\s*\|/);
    if (t) {
      map.set(Number(t[1]), t[2].toLowerCase());
    }
  }
  return map;
}

function parseQuestions(markdown, filePath) {
  const lines = markdown.split("\n");
  const answerMap = parseAnswerMap(markdown);
  const fallbackTopic = mapTopicFromPath(filePath);
  let activeTopic = fallbackTopic;
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hTopic = mapTopicFromHeader(line);
    if (hTopic) activeTopic = hTopic;

    let m = line.match(/^###\s+Question\s+(\d+)\s*$/i);
    let qNum = null;
    let promptSeed = "";
    if (m) qNum = Number(m[1]);
    else {
      const q = line.match(/^\*\*Q(\d+)\.\*\*\s*(.*)$/i);
      if (q) {
        qNum = Number(q[1]);
        promptSeed = q[2].trim();
      }
    }
    if (!qNum) continue;

    let prompt = promptSeed;
    const options = [];
    const localTopic = activeTopic;

    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (/^###\s+Question\s+\d+/i.test(l) || /^\*\*Q\d+\.\*\*/i.test(l)) {
        i = j - 1;
        break;
      }
      const sectionTopic = mapTopicFromHeader(l);
      if (sectionTopic) {
        activeTopic = sectionTopic;
      }
      const original = l.match(/^\*\*Original:\*\*\s*(.+)$/i);
      if (original && !prompt) {
        prompt = `Original: ${stripMd(original[1])}`;
      }
      const opt = l.match(/^\(([A-D])\)\s+(.+)$/);
      if (opt) {
        options.push({
          id: opt[1].toLowerCase(),
          label: stripMd(opt[2]),
        });
      } else if (!prompt && l && !l.startsWith("---") && !l.startsWith("#") && !l.startsWith("|")) {
        prompt = stripMd(l);
      }

      if (options.length >= 4 && (j + 1 >= lines.length || lines[j + 1].trim().startsWith("---"))) {
        i = j;
        break;
      }
    }

    const correct = answerMap.get(qNum);
    if (!prompt || options.length !== 4 || !correct) continue;
    if (!["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"].includes(localTopic ?? "")) {
      continue;
    }

    const stem = toSlug(path.basename(filePath, ".md"));
    results.push({
      questionId: `${stem}-q${qNum}`,
      topic: localTopic,
      subtopic: `${localTopic}-${stem}`,
      difficultyLevel: difficultyFromPath(filePath),
      questionText: prompt,
      options,
      correctOptionId: correct,
      explanation: `Imported from ${path.basename(filePath)}`,
      distractorExplanations: {},
      estimatedTimeSec: localTopic === "reading_comprehension" ? 90 : 55,
      tags: ["imported", path.basename(filePath, ".md")],
    });
  }
  return results;
}

function buildLesson(markdown, filePath) {
  const moduleSlug = mapModuleSlug(filePath);
  if (!moduleSlug) return null;
  if (filePath.includes("/00_PROJECT_PLANNING/")) return null;
  if (filePath.includes("/practice_quizzes/")) return null;
  if (/simulation_\d+_/i.test(path.basename(filePath))) return null;
  if (path.basename(filePath).toLowerCase() === "navigation.md") return null;
  if (path.basename(filePath).toLowerCase() === "readme.md") return null;

  const clean = stripMd(markdown);
  const lines = clean.split("\n").map((x) => x.trim()).filter(Boolean);
  const title =
    lines.find((x) => !x.startsWith("---"))?.replace(/^🎯|^📚|^📝|^🏆|^📊|^🌟|^📖|^📋|^🆕|^🔄|^📘|^📕|^📗|^📙|^⚡|^🔰/g, "").trim() ||
    path.basename(filePath, ".md");
  const paragraphs = clean
    .split(/\n\s*\n/g)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !x.startsWith("---"));
  const bullets = clean
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => /^[-*]\s+/.test(x))
    .map((x) => x.replace(/^[-*]\s+/, "").trim())
    .slice(0, 6);

  const introBody = paragraphs[0] ?? title;
  const explanationBody = (paragraphs.slice(1, 4).join("\n\n") || paragraphs[0] || title).slice(0, 2500);
  const exampleItems =
    bullets.length > 0
      ? bullets.slice(0, 4)
      : (paragraphs[2] ? [paragraphs[2]] : [paragraphs[0] || title]);
  const summaryBullets = (bullets.slice(-3).length ? bullets.slice(-3) : paragraphs.slice(-3)).map((x) => x.slice(0, 220));

  const lessonId = toSlug(path.basename(filePath, ".md"));
  const estimatedMinutes = Math.max(8, Math.min(45, Math.round(clean.split(/\s+/).length / 180)));

  return {
    moduleSlug,
    lessonId,
    lessonTitle: title.slice(0, 120),
    lessonKind: "text",
    estimatedMinutes,
    contentBlocks: [
      { type: "intro", title: "פתיחה", body: introBody.slice(0, 1600) },
      { type: "explanation", title: "הסבר", body: explanationBody },
      { type: "examples", title: "דוגמאות", items: exampleItems.slice(0, 6) },
      { type: "summary", title: "סיכום", bullets: summaryBullets.slice(0, 6) },
    ],
    transcriptOrAudioNotes: {
      transcriptText: "",
      audioNotes: [],
    },
    aiRetrievalText: clean.slice(0, 12000),
  };
}

function parseTimeLimitSec(markdown, fallbackMinutes = 10) {
  const m = markdown.match(/\*\*זמן מומלץ:\*\*\s*(\d+)\s*דקות/i);
  if (m) return Number(m[1]) * 60;
  return fallbackMinutes * 60;
}

function buildPracticeSets(filePath, markdown, questions) {
  if (!filePath.includes("/practice_quizzes/") && !filePath.includes("diagnostic")) return [];
  const groups = new Map();
  for (const q of questions) {
    if (!groups.has(q.topic)) groups.set(q.topic, []);
    groups.get(q.topic).push(q);
  }
  const out = [];
  const stem = toSlug(path.basename(filePath, ".md"));
  const timeLimitSec = parseTimeLimitSec(markdown, 12);

  for (const [topic, rows] of groups.entries()) {
    if (!rows.length) continue;
    const min = Math.min(...rows.map((r) => r.difficultyLevel));
    const max = Math.max(...rows.map((r) => r.difficultyLevel));
    out.push({
      practiceSetId: `ps-${stem}-${topic}`,
      moduleSlug: topicToModule(topic),
      title: `Practice ${stem} (${topic})`,
      topic,
      subtopics: Array.from(new Set(rows.map((r) => r.subtopic))).slice(0, 12),
      difficultyRange: { min, max },
      numberOfQuestions: rows.length,
      timeLimitSec,
    });
  }
  return out;
}

function buildSimulationSections(markdown, filePath) {
  if (!/simulation_\d+_/i.test(path.basename(filePath))) return [];
  const stem = toSlug(path.basename(filePath, ".md"));
  const simulationId = stem.replace(/^simulation-/, "sim-");
  const out = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const row = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*(\d+)\s*\|\s*(\d+)\s*דקות/i);
    if (!row) continue;
    const sectionIndex = Number(row[1]);
    const typeText = row[2].toLowerCase();
    const questionCount = Number(row[3]);
    const timeLimitSec = Number(row[4]) * 60;
    const topic = mapTopicFromHeader(typeText);
    if (!topic) continue;
    const pilot = typeText.includes("ניסיוני") || typeText.includes("experimental");
    out.push({
      simulationId,
      sectionId: `${simulationId}-section-${sectionIndex}`,
      sectionType: topic,
      scoringMode: pilot ? "pilot" : "scored",
      questionCount,
      timeLimitSec,
      adaptiveRules: {
        adaptiveWithinSection: false,
        adaptiveBetweenSections: true,
        enterLevelSource: "previous_section_performance",
        levelUpRule: ">=75_percent_correct_then_plus_1",
        levelDownRule: "<=25_percent_correct_then_minus_1",
        bounds: { min: 1, max: 6 },
      },
    });
  }
  return out;
}

function writeJson(fileName, value) {
  const p = path.join(OUTPUT_ROOT, fileName);
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const files = walk(INPUT_ROOT)
    .filter((p) => p.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const lessons = [];
  const questions = [];
  const practiceSets = [];
  const simulations = [];
  const aiRetrieval = [];
  const seenQuestionIds = new Set();
  const seenLessonIds = new Set();

  for (const filePath of files) {
    const markdown = fs.readFileSync(filePath, "utf8");
    const parsedQuestions = parseQuestions(markdown, filePath);
    for (const q of parsedQuestions) {
      if (seenQuestionIds.has(q.questionId)) continue;
      seenQuestionIds.add(q.questionId);
      questions.push(q);
    }
    for (const ps of buildPracticeSets(filePath, markdown, parsedQuestions)) {
      practiceSets.push(ps);
    }
    for (const sim of buildSimulationSections(markdown, filePath)) {
      simulations.push(sim);
    }

    const lesson = buildLesson(markdown, filePath);
    if (!lesson) continue;
    if (seenLessonIds.has(lesson.lessonId)) continue;
    seenLessonIds.add(lesson.lessonId);
    lessons.push(lesson);
    aiRetrieval.push({
      docId: `doc-${lesson.lessonId}`,
      lessonId: lesson.lessonId,
      moduleSlug: lesson.moduleSlug,
      title: lesson.lessonTitle,
      body: lesson.aiRetrievalText,
      tags: ["imported_markdown", lesson.moduleSlug],
    });
  }

  writeJson("lessons.json", lessons);
  writeJson("questions.json", questions);
  writeJson("practice-sets.json", practiceSets);
  writeJson("simulations.json", simulations);
  writeJson("ai-retrieval.json", aiRetrieval);

  console.log(
    JSON.stringify(
      {
        filesScanned: files.length,
        lessons: lessons.length,
        questions: questions.length,
        practiceSets: practiceSets.length,
        simulations: simulations.length,
        aiRetrieval: aiRetrieval.length,
      },
      null,
      2,
    ),
  );
}

main();
