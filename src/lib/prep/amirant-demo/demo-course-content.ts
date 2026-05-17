/**
 * Mirrors `supabase/seeds/amirant-demo.sql` — use for in-browser practice without DB.
 * Keep in sync when editing the SQL seed.
 */
import { selectNextQuestion, type QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_COURSE_SYLLABUS_META,
  AMIRANT_COURSE_SYLLABUS_PARTS,
  type SyllabusBullet,
  type SyllabusPart,
} from "@/lib/prep/amirant-course-syllabus";
import { AMIRANT_DEMO_IDS } from "./seed-constants";

const T = AMIRANT_DEMO_IDS.topics;
const S = AMIRANT_DEMO_IDS.subtopics;

export type DemoLessonKind = "video" | "text" | "mixed";

export interface DemoLesson {
  id: string;
  moduleId: string;
  title: string;
  sortOrder: number;
  kind: DemoLessonKind;
  bodyPreview: string;
  videoPath: string | null;
  estimatedMinutes: number | null;
}

export interface DemoModule {
  id: string;
  title: string;
  sortOrder: number;
  lessons: DemoLesson[];
}

export interface DemoQuizMeta {
  id: string;
  lessonId: string;
  title: string;
  timeLimitSec: number;
  passingScorePct: number;
}

export interface DemoQuestionOption {
  id: string;
  label: string;
}

export interface DemoQuestion {
  id: string;
  orderIndex: number;
  prompt: string;
  topicId: string;
  subtopicId: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  explanation: string;
  options: DemoQuestionOption[];
  correctOptionId: string;
}

export const AMIRANT_DEMO_COURSE = {
  id: AMIRANT_DEMO_IDS.course,
  title: AMIRANT_COURSE_SYLLABUS_META.courseTitleHe,
  description: AMIRANT_COURSE_SYLLABUS_META.shortNoteHe,
} as const;

function collectSyllabusLeaves(bullets: SyllabusBullet[]): SyllabusBullet[] {
  const out: SyllabusBullet[] = [];
  const walk = (b: SyllabusBullet) => {
    if (b.children?.length) b.children.forEach(walk);
    else out.push(b);
  };
  bullets.forEach(walk);
  return out;
}

function moduleThemeHe(partId: string): string {
  switch (partId) {
    case "intro":
      return "מבוא";
    case "vocab":
      return "אוצר מילים";
    case "sentence-completion":
      return "השלמת משפטים";
    case "restatement":
      return "ניסוח מחדש";
    case "reading":
      return "הבנת הנקרא";
    case "pilot-2026":
      return "פיילוט ו־2026";
    case "full-sims":
      return "סימולציות וסיום";
    default:
      return "הקורס";
  }
}

function lessonKindForSyllabusLeaf(_partId: string, title: string): DemoLessonKind {
  if (title.includes("סרטון")) return "video";
  return "mixed";
}

function bodyPreviewForSyllabusLeaf(part: SyllabusPart, leaf: SyllabusBullet): string {
  const theme = moduleThemeHe(part.id);
  return `יחידה בנושא «${theme}»: ${leaf.title}. תוכן מלא (מדריך, אודיו, תרגול) יתווסף בהמשך — כרגע זהו מבנה הקורס לפי הסילבוס.`;
}

function estimatedMinutesForSyllabusLeaf(partId: string, title: string): number {
  if (title.includes("סרטון")) return 12;
  if (title.includes("מקבצי מבחן") || title.includes("אדפטיבי")) return 35;
  if (title.includes("מקבצי שאלות")) return 22;
  if (title.includes("מבחן") && title.includes("מלא")) return 50;
  if (partId === "full-sims") {
    if (title.includes("מדריך") || title.includes("טיפים")) return 18;
    if (title.includes("שאלון") || title.includes("פידבק")) return 12;
    return 20;
  }
  if (partId === "vocab" && title.includes("כרטיסיות")) return 30;
  if (partId === "intro") return 20;
  return 25;
}

function lessonsFromSyllabusPart(part: SyllabusPart): DemoLesson[] {
  const moduleId = `syllabus-mod-${part.id}`;
  const leaves = collectSyllabusLeaves(part.bullets);
  return leaves.map((leaf, i) => ({
    id: `syllabus-lesson-${leaf.id}`,
    moduleId,
    title: leaf.title,
    sortOrder: i,
    kind: lessonKindForSyllabusLeaf(part.id, leaf.title),
    bodyPreview: bodyPreviewForSyllabusLeaf(part, leaf),
    videoPath: null,
    estimatedMinutes: estimatedMinutesForSyllabusLeaf(part.id, leaf.title),
  }));
}

/** מבנה הקורס: שיעור לכל פריט עלה בסילבוס + מבחן מערכת בסוף מודול הסימולציות. */
export function buildAmirantCourseModules(): DemoModule[] {
  const modules: DemoModule[] = AMIRANT_COURSE_SYLLABUS_PARTS.map((part, mi) => ({
    id: `syllabus-mod-${part.id}`,
    title: `${mi + 1}. ${part.title}`,
    sortOrder: mi,
    lessons: lessonsFromSyllabusPart(part),
  }));

  const fullSims = modules.find((m) => m.id === "syllabus-mod-full-sims");
  if (fullSims) {
    fullSims.lessons.push({
      id: AMIRANT_DEMO_IDS.lessons.m2exam,
      moduleId: fullSims.id,
      title: "מבחן סימולציה מלא — הפעלת מנוע אדפטיבי",
      sortOrder: fullSims.lessons.length,
      kind: "mixed",
      bodyPreview:
        "16 שאלות ציון ב־39 דק׳ לפרקי האמת, פרק פיילוט נפרד, ניווט ותיקון תשובות בתוך כל פרק, והתאמת רמה בין פרקים ובין מבחנים.",
      videoPath: null,
      estimatedMinutes: 50,
    });
  }

  return modules;
}

export const AMIRANT_DEMO_MODULES: DemoModule[] = buildAmirantCourseModules();

export const AMIRANT_DEMO_QUIZ: DemoQuizMeta = {
  id: AMIRANT_DEMO_IDS.quiz,
  lessonId: AMIRANT_DEMO_IDS.lessons.m2exam,
  title: "בוחן דמו אמירנט — גרסת מערכת",
  /** 39 דק׳ לפרקי ציון (ללא פיילוט) — עקבי עם סילבוס הסימולציה. */
  timeLimitSec: 2340,
  passingScorePct: 60,
};

/** Full question bank — IDs align with seed SQL. */
export const AMIRANT_DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "20000001-0000-4000-8000-000000000101",
    orderIndex: 1,
    prompt: 'The study _____ a significant link between diet and focus.',
    topicId: T.vocabulary,
    subtopicId: S.academicVerbs,
    difficulty: 1,
    explanation: 'Subject "study" is singular; present tense "demonstrates" agrees.',
    correctOptionId: "20000001-0000-4000-8000-000000000201",
    options: [
      { id: "20000001-0000-4000-8000-000000000201", label: "demonstrates" },
      { id: "20000001-0000-4000-8000-000000000202", label: "demonstrate" },
      { id: "20000001-0000-4000-8000-000000000203", label: "demonstrated" },
      { id: "20000001-0000-4000-8000-000000000204", label: "demonstrating" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000102",
    orderIndex: 2,
    prompt:
      'Primary purpose of the paragraph: "Many students underestimate how much time reading in English actually takes. Planning blocks of 45 minutes tends to work better than short fragments."',
    topicId: T.reading,
    subtopicId: S.mainIdea,
    difficulty: 1,
    explanation: "Main idea: allocate meaningful time blocks for English reading.",
    correctOptionId: "20000001-0000-4000-8000-000000000206",
    options: [
      { id: "20000001-0000-4000-8000-000000000205", label: "Short fragments are always better than long sessions" },
      { id: "20000001-0000-4000-8000-000000000206", label: "Students should plan longer focused blocks for reading in English" },
      { id: "20000001-0000-4000-8000-000000000207", label: "Reading in English takes the same time as in Hebrew" },
      { id: "20000001-0000-4000-8000-000000000208", label: "The paragraph is mainly about diet" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000103",
    orderIndex: 3,
    prompt: "_____, the team decided to postpone the experiment.",
    topicId: T.sentence,
    subtopicId: S.connectors,
    difficulty: 2,
    explanation: '"However" introduces contrast with the previous clause (often implied).',
    correctOptionId: "20000001-0000-4000-8000-000000000209",
    options: [
      { id: "20000001-0000-4000-8000-000000000209", label: "However" },
      { id: "20000001-0000-4000-8000-000000000210", label: "Although" },
      { id: "20000001-0000-4000-8000-000000000211", label: "Therefore" },
      { id: "20000001-0000-4000-8000-000000000212", label: "Moreover" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000104",
    orderIndex: 4,
    prompt: 'Choose the closest synonym to "significant" in academic writing:',
    topicId: T.vocabulary,
    subtopicId: S.synonyms,
    difficulty: 2,
    explanation: '"Substantial" matches formal nuance of "significant".',
    correctOptionId: "20000001-0000-4000-8000-000000000214",
    options: [
      { id: "20000001-0000-4000-8000-000000000213", label: "tiny" },
      { id: "20000001-0000-4000-8000-000000000214", label: "substantial" },
      { id: "20000001-0000-4000-8000-000000000215", label: "irrelevant" },
      { id: "20000001-0000-4000-8000-000000000216", label: "random" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000105",
    orderIndex: 5,
    prompt:
      "It can be inferred from the passage that the author believes open-ended questions are useful because _____.",
    topicId: T.reading,
    subtopicId: S.inference,
    difficulty: 3,
    explanation: "Inference must follow evidence in the text, not outside knowledge.",
    correctOptionId: "20000001-0000-4000-8000-000000000218",
    options: [
      { id: "20000001-0000-4000-8000-000000000217", label: "They are useless" },
      { id: "20000001-0000-4000-8000-000000000218", label: "They encourage deeper processing of the text" },
      { id: "20000001-0000-4000-8000-000000000219", label: "They replace the need to read" },
      { id: "20000001-0000-4000-8000-000000000220", label: "They are only for beginners" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000106",
    orderIndex: 6,
    prompt: "Complete: Students are expected to _____ with the assigned readings before class.",
    topicId: T.sentence,
    subtopicId: S.collocations,
    difficulty: 3,
    explanation: 'Collocation: "engage with" readings is natural academic English.',
    correctOptionId: "20000001-0000-4000-8000-000000000222",
    options: [
      { id: "20000001-0000-4000-8000-000000000221", label: "argue against" },
      { id: "20000001-0000-4000-8000-000000000222", label: "engage with" },
      { id: "20000001-0000-4000-8000-000000000223", label: "ignore" },
      { id: "20000001-0000-4000-8000-000000000224", label: "copy" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000107",
    orderIndex: 7,
    prompt: "Which verb fits best? The data _____ previous assumptions.",
    topicId: T.vocabulary,
    subtopicId: S.academicVerbs,
    difficulty: 3,
    explanation: '"Challenge" fits academic reporting; check tense and agreement.',
    correctOptionId: "20000001-0000-4000-8000-000000000226",
    options: [
      { id: "20000001-0000-4000-8000-000000000225", label: "ignores" },
      { id: "20000001-0000-4000-8000-000000000226", label: "challenges" },
      { id: "20000001-0000-4000-8000-000000000227", label: "copy" },
      { id: "20000001-0000-4000-8000-000000000228", label: "decorate" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000108",
    orderIndex: 8,
    prompt: "The author's tone in the conclusion is best described as _____.",
    topicId: T.reading,
    subtopicId: S.mainIdea,
    difficulty: 4,
    explanation: "Identify tone from word choice, not your personal reaction.",
    correctOptionId: "20000001-0000-4000-8000-000000000230",
    options: [
      { id: "20000001-0000-4000-8000-000000000229", label: "hostile" },
      { id: "20000001-0000-4000-8000-000000000230", label: "cautiously optimistic" },
      { id: "20000001-0000-4000-8000-000000000231", label: "sarcastic" },
      { id: "20000001-0000-4000-8000-000000000232", label: "joyful" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000109",
    orderIndex: 9,
    prompt: "_____ the budget was limited, the pilot succeeded.",
    topicId: T.sentence,
    subtopicId: S.connectors,
    difficulty: 4,
    explanation: '"Although" sets up concessive clause; comma separates clauses correctly.',
    correctOptionId: "20000001-0000-4000-8000-000000000233",
    options: [
      { id: "20000001-0000-4000-8000-000000000233", label: "Although" },
      { id: "20000001-0000-4000-8000-000000000234", label: "Because" },
      { id: "20000001-0000-4000-8000-000000000235", label: "Unless" },
      { id: "20000001-0000-4000-8000-000000000236", label: "While" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000110",
    orderIndex: 10,
    prompt: 'Pick the best synonym for "prevalent" in a formal text:',
    topicId: T.vocabulary,
    subtopicId: S.synonyms,
    difficulty: 4,
    explanation: '"Widespread" is a close formal synonym depending on context.',
    correctOptionId: "20000001-0000-4000-8000-000000000238",
    options: [
      { id: "20000001-0000-4000-8000-000000000237", label: "rare" },
      { id: "20000001-0000-4000-8000-000000000238", label: "widespread" },
      { id: "20000001-0000-4000-8000-000000000239", label: "illegal" },
      { id: "20000001-0000-4000-8000-000000000240", label: "private" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000111",
    orderIndex: 11,
    prompt: "Which statement is most supported by the passage alone?",
    topicId: T.reading,
    subtopicId: S.inference,
    difficulty: 5,
    explanation: "High difficulty: avoid over-inference beyond explicit support.",
    correctOptionId: "20000001-0000-4000-8000-000000000242",
    options: [
      { id: "20000001-0000-4000-8000-000000000241", label: "The author dislikes universities" },
      { id: "20000001-0000-4000-8000-000000000242", label: "The passage supports structured practice over cramming" },
      { id: "20000001-0000-4000-8000-000000000243", label: "Cramming always works" },
      { id: "20000001-0000-4000-8000-000000000244", label: "The author is neutral about all methods" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000112",
    orderIndex: 12,
    prompt: "Choose the natural collocation: The policy aims to _____ access to higher education.",
    topicId: T.sentence,
    subtopicId: S.collocations,
    difficulty: 5,
    explanation: '"Expand access" is a standard academic collocation.',
    correctOptionId: "20000001-0000-4000-8000-000000000246",
    options: [
      { id: "20000001-0000-4000-8000-000000000245", label: "reduce" },
      { id: "20000001-0000-4000-8000-000000000246", label: "expand" },
      { id: "20000001-0000-4000-8000-000000000247", label: "deny" },
      { id: "20000001-0000-4000-8000-000000000248", label: "ignore" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000113",
    orderIndex: 13,
    prompt: "The findings are _____ with earlier studies on sleep and memory.",
    topicId: T.sentence,
    subtopicId: S.collocations,
    difficulty: 3,
    explanation: '"Consistent with" is a standard academic collocation.',
    correctOptionId: "20000001-0000-4000-8000-000000000250",
    options: [
      { id: "20000001-0000-4000-8000-000000000249", label: "angry" },
      { id: "20000001-0000-4000-8000-000000000250", label: "consistent" },
      { id: "20000001-0000-4000-8000-000000000251", label: "silent" },
      { id: "20000001-0000-4000-8000-000000000252", label: "heavy" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000114",
    orderIndex: 14,
    prompt: 'In academic writing, "mitigate" is closest in meaning to:',
    topicId: T.vocabulary,
    subtopicId: S.synonyms,
    difficulty: 4,
    explanation: '"Mitigate" means to make something less severe — "alleviate" fits best here.',
    correctOptionId: "20000001-0000-4000-8000-000000000254",
    options: [
      { id: "20000001-0000-4000-8000-000000000253", label: "worsen" },
      { id: "20000001-0000-4000-8000-000000000254", label: "alleviate" },
      { id: "20000001-0000-4000-8000-000000000255", label: "ignore completely" },
      { id: "20000001-0000-4000-8000-000000000256", label: "postpone indefinitely" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000115",
    orderIndex: 15,
    prompt:
      'The paragraph argues that "peer review does not guarantee truth, but it reduces obvious errors." The author\'s stance is best described as:',
    topicId: T.reading,
    subtopicId: S.mainIdea,
    difficulty: 5,
    explanation: "The author acknowledges limits while defending a modest benefit — qualified support.",
    correctOptionId: "20000001-0000-4000-8000-000000000258",
    options: [
      { id: "20000001-0000-4000-8000-000000000257", label: "Peer review is useless" },
      { id: "20000001-0000-4000-8000-000000000258", label: "Peer review is imperfect but still valuable" },
      { id: "20000001-0000-4000-8000-000000000259", label: "Truth is impossible in science" },
      { id: "20000001-0000-4000-8000-000000000260", label: "Errors are impossible after review" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000116",
    orderIndex: 16,
    prompt: "_____ several limitations, the model predicts outcomes reasonably well.",
    topicId: T.sentence,
    subtopicId: S.connectors,
    difficulty: 5,
    explanation:
      "Despite + noun phrase introduces concession; Although would need a full clause in this slot.",
    correctOptionId: "20000001-0000-4000-8000-000000000261",
    options: [
      { id: "20000001-0000-4000-8000-000000000261", label: "Despite" },
      { id: "20000001-0000-4000-8000-000000000262", label: "Although" },
      { id: "20000001-0000-4000-8000-000000000263", label: "Because" },
      { id: "20000001-0000-4000-8000-000000000264", label: "Unless" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000117",
    orderIndex: 17,
    prompt: 'Choose the best replacement for "ubiquitous" in a formal abstract:',
    topicId: T.vocabulary,
    subtopicId: S.synonyms,
    difficulty: 6,
    explanation: '"Pervasive" captures "present everywhere" in formal registers.',
    correctOptionId: "20000001-0000-4000-8000-000000000266",
    options: [
      { id: "20000001-0000-4000-8000-000000000265", label: "rare" },
      { id: "20000001-0000-4000-8000-000000000266", label: "pervasive" },
      { id: "20000001-0000-4000-8000-000000000267", label: "illegal" },
      { id: "20000001-0000-4000-8000-000000000268", label: "temporary" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000118",
    orderIndex: 18,
    prompt:
      "From the passage alone: if the experiment lacked a control group, what is the most careful conclusion?",
    topicId: T.reading,
    subtopicId: S.inference,
    difficulty: 6,
    explanation: "Without a control group, causal claims should be weakened to correlational language.",
    correctOptionId: "20000001-0000-4000-8000-000000000270",
    options: [
      { id: "20000001-0000-4000-8000-000000000269", label: "The treatment definitely caused the outcome" },
      { id: "20000001-0000-4000-8000-000000000270", label: "Causal claims are harder to justify" },
      { id: "20000001-0000-4000-8000-000000000271", label: "The outcome is meaningless" },
      { id: "20000001-0000-4000-8000-000000000272", label: "Replication is unnecessary" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000119",
    orderIndex: 19,
    prompt: "The committee was reluctant to _____ the controversial proposal without further data.",
    topicId: T.sentence,
    subtopicId: S.collocations,
    difficulty: 6,
    explanation: '"Endorse" collocates with proposals in academic/policy contexts.',
    correctOptionId: "20000001-0000-4000-8000-000000000274",
    options: [
      { id: "20000001-0000-4000-8000-000000000273", label: "borrow" },
      { id: "20000001-0000-4000-8000-000000000274", label: "endorse" },
      { id: "20000001-0000-4000-8000-000000000275", label: "paint" },
      { id: "20000001-0000-4000-8000-000000000276", label: "ignore" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000120",
    orderIndex: 20,
    prompt: 'Which verb best fits? The authors _____ that the effect may be culturally specific.',
    topicId: T.vocabulary,
    subtopicId: S.academicVerbs,
    difficulty: 5,
    explanation: "Acknowledge is common hedging in academic discussion of limitations.",
    correctOptionId: "20000001-0000-4000-8000-000000000278",
    options: [
      { id: "20000001-0000-4000-8000-000000000277", label: "deny" },
      { id: "20000001-0000-4000-8000-000000000278", label: "acknowledge" },
      { id: "20000001-0000-4000-8000-000000000279", label: "forget" },
      { id: "20000001-0000-4000-8000-000000000280", label: "destroy" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000121",
    orderIndex: 21,
    prompt:
      'Which option best restates the meaning? Original: "The policy is unlikely to change before the election."',
    topicId: T.rephrasing,
    subtopicId: S.restatement,
    difficulty: 3,
    explanation:
      'Same meaning: unlikely to change prior to the election = not expected to change before it.',
    correctOptionId: "20000001-0000-4000-8000-000000000282",
    options: [
      { id: "20000001-0000-4000-8000-000000000281", label: "The policy will probably change immediately after the election" },
      { id: "20000001-0000-4000-8000-000000000282", label: "The policy is not expected to change prior to the election" },
      { id: "20000001-0000-4000-8000-000000000283", label: "The election forced an immediate policy change" },
      { id: "20000001-0000-4000-8000-000000000284", label: "The policy had already changed before the campaign" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000122",
    orderIndex: 22,
    prompt: 'Choose the closest restatement: "She declined the offer because it conflicted with her values."',
    topicId: T.rephrasing,
    subtopicId: S.restatement,
    difficulty: 4,
    explanation: '"Turned down" = declined; "clashed with" parallels "conflicted with" in this context.',
    correctOptionId: "20000001-0000-4000-8000-000000000286",
    options: [
      { id: "20000001-0000-4000-8000-000000000285", label: "She accepted the offer because it matched her values" },
      { id: "20000001-0000-4000-8000-000000000286", label: "She turned down the offer as it clashed with her principles" },
      { id: "20000001-0000-4000-8000-000000000287", label: "She ignored the offer and never read it" },
      { id: "20000001-0000-4000-8000-000000000288", label: "She revised the offer to match her budget" },
    ],
  },
  {
    id: "20000001-0000-4000-8000-000000000123",
    orderIndex: 23,
    prompt: 'Best paraphrase: "Notwithstanding the risks, the team pushed ahead with the trial."',
    topicId: T.rephrasing,
    subtopicId: S.restatement,
    difficulty: 5,
    explanation: '"Notwithstanding" = despite; "pushed ahead" = continued / proceeded.',
    correctOptionId: "20000001-0000-4000-8000-000000000290",
    options: [
      { id: "20000001-0000-4000-8000-000000000289", label: "Because of the risks, the team cancelled the trial" },
      { id: "20000001-0000-4000-8000-000000000290", label: "Despite the risks, the team continued with the trial" },
      { id: "20000001-0000-4000-8000-000000000291", label: "The team avoided the trial due to minor risks" },
      { id: "20000001-0000-4000-8000-000000000292", label: "The risks were removed before the trial began" },
    ],
  },
];

export function toQuestionPoolItems(questions: DemoQuestion[]): QuestionPoolItem[] {
  return questions.map((q) => ({
    questionId: q.id,
    topicId: q.topicId,
    subtopicId: q.subtopicId,
    difficultyLevel: q.difficulty,
  }));
}

export const AMIRANT_DEMO_QUESTION_POOL: QuestionPoolItem[] = toQuestionPoolItems(AMIRANT_DEMO_QUESTIONS);

/** Free short diagnostic: intermediate+ only (Amirant practice flow). */
const DEMO_SHORT_QUIZ_MIN_D: 1 | 2 | 3 | 4 | 5 | 6 = 3;
const DEMO_SHORT_QUIZ_MAX_D: 1 | 2 | 3 | 4 | 5 | 6 = 5;

export const AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL: QuestionPoolItem[] = toQuestionPoolItems(
  AMIRANT_DEMO_QUESTIONS.filter(
    (q) => q.difficulty >= DEMO_SHORT_QUIZ_MIN_D && q.difficulty <= DEMO_SHORT_QUIZ_MAX_D,
  ),
);

/** How many questions in the free short demo session (`AmirantPracticeFlow`). */
export const AMIRANT_DEMO_SHORT_QUIZ_LENGTH = 10 as const;

function pickFirstInTopicDemo(pool: QuestionPoolItem[], topicId: string): QuestionPoolItem | null {
  const inTopic = pool.filter((q) => q.topicId === topicId);
  if (inTopic.length === 0) return null;
  return [...inTopic].sort((a, b) => a.questionId.localeCompare(b.questionId))[0] ?? null;
}

/** First question for the short demo (must match `startShortQuiz` in `AmirantPracticeFlow`). */
export function getFirstShortDemoQuestionId(tieBreakSalt: string): string | null {
  const firstTopic = AMIRANT_DEMO_IDS.topics.sentence;
  const sel =
    selectNextQuestion({
      pool: AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL,
      topicId: firstTopic,
      targetLevel: 3,
      recentQuestionIds: [],
      tieBreakSalt,
    }) ?? pickFirstInTopicDemo(AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL, firstTopic);
  return sel?.questionId ?? null;
}
