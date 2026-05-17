/**
 * Official syllabus labels & static teaching copy for Amirant course UI.
 * Display-only — does not change manifest or backend. Keys are stable `module.id` values.
 *
 * Syllabus ↔ manifest (9 blocks):
 * | # | Spec | module.id | manifest slug |
 * | 1 | Introduction | mod-intro | introduction |
 * | 2 | Vocabulary | mod-vocab | vocabulary |
 * | 3 | Sentence Completion | mod-sc | sentence-completion |
 * | 4 | Rephrasing | mod-rephrase | sentence-rephrasing |
 * | 5 | Reading Comprehension | mod-reading | reading-comprehension |
 * | 6 | 2026 New Sections (Listening, Word Formation, Writing) | mod-reform | new-exam-format-2026 |
 * | 7 | Full Simulations | mod-sims | full-simulations |
 * | 8 | Tips & Strategy | mod-tips | tips-strategies |
 * | 9 | Course Summary | mod-summary | course-summary |
 */
import type { ManifestModule } from "./types/course-manifest";

export type SyllabusModuleKind =
  | "introduction"
  | "vocabulary"
  | "sentence_completion"
  | "rephrasing"
  | "reading"
  | "pilot_2026"
  | "simulations"
  | "tips"
  | "summary";

export type SyllabusModuleUi = {
  order: number;
  /** Full title shown in program (Hebrew). */
  titleHe: string;
  /** One-line for cards. */
  oneLinerHe: string;
  kind: SyllabusModuleKind;
  /** Static paragraphs for the module page (explanation, usage, schedule). */
  howToHe: string[];
  /** Vocabulary: level labels; other modules omit. */
  levelLabelsHe?: { easy: string; medium: string; hard: string };
  /** 2026 module: sub-skills. */
  reformBulletsHe?: string[];
  /** Freeform notes for practice / sim / tips sections. */
  contentNotesHe?: string[];
};

const SYLLABUS_BY_MODULE_ID: Record<string, SyllabusModuleUi> = {
  "mod-intro": {
    order: 1,
    titleHe: "מבוא",
    oneLinerHe:
      "יחידה 1: ברוכים הבאים — מבנה אמירנט, ציונים, מחויבות, לו״ז. יחידה 1.3: אבחון 15 שאלות. יחידה 2: לוגיסטיקה, הרשמה, מחיר, מועדים, יום בחינה (מסמכי המבוא המלאים).",
    kind: "introduction",
    howToHe: [
      "פתיחה: ברוכים הבאים, אחר כך מפת הדרכים, ולסיום שאלון ציפיות — שלושה שיעורים נפרדים, כולם מבוססים על אותו מסמך בסיס.",
      "אבחון כניסה: 6 השלמות, 4 ניסוח, 5 קריאה — ~20 דק׳, ואז \"מבחן\" בקורס (מנוע אדפטיבי, 15 שאלות).",
      "יחידה 2: אמירנט/ניב״ה, הרשמה, עלויות, ביטול, מקומות, מועדים, ציון, מה לקחת ליום, התאמות, FAQ, צ'ק-ליסט (לפי מסמכי היחידה).",
      "הקישור בין ציונים (50–150) לדרישות אקדמיה ולתכנית אישית.",
      "השיטה: תרגול שוטף, בדיקה אחרי כל בוחן, סימולציה בתנאים אמיתיים לפני המבחן.",
    ],
  },
  "mod-vocab": {
    order: 2,
    titleHe: "מילון מושגים",
    oneLinerHe: "רמות: קלה, בינונית, גבוהה מאוד — כרטיסיות, אינטראקטיבי, מבחנים עצמיים",
    kind: "vocabulary",
    levelLabelsHe: {
      easy: "מילים ברמה קלה",
      medium: "מילים ברמה בינונית",
      hard: "מילים ברמה גבוהה מאוד",
    },
    howToHe: [
      "לימוד לפי רמות, עם דגש על הערכה עצמית — מה שנוח לכם ללחזור עליו לפני המבחן.",
      "יצירת כרטיסיות למידה / אלמנט אינטראקטיבי ומשחקי זיכרון (לפי מה שמוצע בקורס).",
      "מבחנים עצמיים של למידת מילים — לפי נושאים / סוגי שאלות, או מעורבבים.",
    ],
  },
  "mod-sc": {
    order: 3,
    titleHe: "השלמת מילים במשפט (Sentence Completion)",
    oneLinerHe: "מדריך + אודיו, סרטון, מקבצי שאלות (קל·בינוני·גבוה), מבחן אדפטיבי",
    kind: "sentence_completion",
    howToHe: [
      "שלב 1 — מדריך (כתוב) + הוראות/מסלול אודיו (מופיע בקבצי ה־MD, למשל 4.2).",
      "שלב 2 — סרטון הדרכה / תסריט (למשל שיעור הווידאו 5 שיטות).",
      "שלבים 3–5 — מקבצי שאלות מהבנק: רמה קלה, בינונית, גבוהה (לפי ניקוד קושי בבנק).",
      "שלב 6 — מבחן(ים) אדפטיבי(ים): רמה משתנה לפי ביצוע, כאשר המבחן הראשי פותח בקלות תואמת רמת הפתיחה.",
    ],
  },
  "mod-rephrase": {
    order: 4,
    titleHe: "ניסוח משפטים מחדש (Rephrasing)",
    oneLinerHe: "מדריך כתוב + אודיו, סרטון, תרגול לפי רמות, מבחן אדפטיבי",
    kind: "rephrasing",
    howToHe: [
      "מבנה מודול לפי סילבוס: מדריך כתוב + אודיו, סרטון הדרכה, מקבצי שאלות — קל, בינוני, גבוה, ומבחנים אדפטיביים.",
    ],
  },
  "mod-reading": {
    order: 5,
    titleHe: "הבנת הנקרא — קטעי קריאה (Unseen)",
    oneLinerHe: "מדריך כתוב + אודיו, סרטון, תרגול לפי רמות, מבחן אדפטיבי",
    kind: "reading",
    howToHe: [
      "מבנה מודול לפי סילבוס: מדריך כתוב + אודיו, סרטון הדרכה, מקבצי שאלות — קל, בינוני, גבוה, ומבחנים אדפטיביים — על קטעי קריאה שלא נלמדו מראש.",
    ],
  },
  "mod-reform": {
    order: 6,
    titleHe: "פרקי פיילוט ורפורמות 2026",
    oneLinerHe: "הכנה ל־2026: האזנה, יצירת מילה, מטלת כתיבה",
    kind: "pilot_2026",
    reformBulletsHe: [
      "הבנת הנשמע (Listening): תרגול האזנה להרצאות ושיחות (כ־30–90 שניות) ומענה על שאלות הבנה.",
      "יצירת מילה (Word Formation): לימוד תחיליות וסופיות והטיית מילים (למשל: הפיכת פועל לשם תואר) במשימות הקלדה.",
      "מטלת כתיבה: הכנה לכתיבת טקסט עצמאי (בערך 12 דק׳) בפורמט האקדמי המבוקש.",
    ],
    howToHe: [
      "מודול זה עוסק בפרקי הפיילוט וברפורמות המבחן — שלושת המיומנויות לעיל, בתרגול הדרגתי עד איסוף בזמן אמת.",
    ],
  },
  "mod-sims": {
    order: 7,
    titleHe: "מבחני סימולציה מלאים",
    oneLinerHe: "הדרכה, לפחות 5–6 מבחנים מלאים, ניתוח, מחשבון תוצאות",
    kind: "simulations",
    howToHe: [
      "מדריך איך לבצע מבחן סימולציה — איך להיכנס, איך לנווט, ואיך לנצל ניקוד/זמן בצורה ריאליסטית.",
    ],
    contentNotesHe: [
      "לפי הסילבוס: לפחות 5–6 מבחנים מלאים עם מדידת זמנים, ניתוח ביצועים (לרבות ניתוח בעזרת AI כשהופעל) ומחשבון תוצאות.",
    ],
  },
  "mod-tips": {
    order: 8,
    titleHe: "טיפים מנצחים",
    oneLinerHe: "הכנה לפני המבחן, ניהול זמן במהלכו, טכניקות ושיטות",
    kind: "tips",
    howToHe: [
      "הכנה לפני מבחן: מה לעשות ומה להימנע — בלי \"שטף\" חדש ביומיים האחרונים, עם מיקוד בחיזוק ביצועים.",
      "ניהול זמן נכון במהלך המבחן: סדר פעולה, איפה \"לעצור\" ולחזור, ואיך לא לפספס בלוקים כבדים.",
      "טכניקות ויישום שיטות: בחירת תשובות, זיהוי מלכודות, והתאמה לאופי השאלות אצל אמירם.",
    ],
  },
  "mod-logistics": {
    order: 10,
    titleHe: "לוגיסטיקה וביורוקרטיה",
    oneLinerHe: "הרשמה, מועדים, עלויות, יום בחינה — לפי מסמכי היחידה.",
    kind: "introduction",
    howToHe: [],
  },
  "mod-summary": {
    order: 9,
    titleHe: "סיכום הקורס",
    oneLinerHe: "שאלון, פידבק, \"מה אחרי?\" וצעדים הלאה",
    kind: "summary",
    howToHe: [
      "מודול סיום: סיכום הקורס, שאלון סיכום ופידבק — לסגירת הליך ולשיתוף מה הועיל ומה לחזק.",
      "״מה קורה אחרי?״: מתנות, ניסיון המרה, והמשך מסלול לקורסים — לפי מה שהמוסד/ההצעה מאפשרים (הטמעה בעמוד סיכום כשהיא זמינה).",
    ],
  },
};

/**
 * מניפסט מיובא משתמש ב־`id` מסוג `mod-${slug}`; מיפוי slug → מפתח סילבוס הדמו (mod-sc, mod-sims, …)
 * מבטיח אותו תוכן עברית/מבנה כמו במניפסט הדמו.
 */
const MODULE_SLUG_TO_SYLLABUS_KEY: Record<string, string> = {
  introduction: "mod-intro",
  vocabulary: "mod-vocab",
  "sentence-completion": "mod-sc",
  "sentence-rephrasing": "mod-rephrase",
  "reading-comprehension": "mod-reading",
  "new-exam-format-2026": "mod-reform",
  "full-simulations": "mod-sims",
  "tips-strategies": "mod-tips",
  "course-summary": "mod-summary",
  "logistics-bureaucracy": "mod-logistics",
};

export function getSyllabusUiForModule(module: ManifestModule): SyllabusModuleUi | undefined {
  const byId = SYLLABUS_BY_MODULE_ID[module.id];
  if (byId) return byId;
  const fromSlug = module.slug ? MODULE_SLUG_TO_SYLLABUS_KEY[module.slug] : undefined;
  if (fromSlug) return SYLLABUS_BY_MODULE_ID[fromSlug];
  return undefined;
}

export function displayModuleTitleHe(module: ManifestModule): string {
  return getSyllabusUiForModule(module)?.titleHe ?? module.title;
}

export function getOrderedSyllabusModules(modules: ManifestModule[]): ManifestModule[] {
  return [...modules].sort(
    (a, b) =>
      (getSyllabusUiForModule(a)?.order ?? a.sortOrder) - (getSyllabusUiForModule(b)?.order ?? b.sortOrder),
  );
}
