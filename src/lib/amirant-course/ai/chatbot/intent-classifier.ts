import type { AmirantChatbotRequest, AmirantChatIntent, AmirantClientAction, AmirantQuestionType } from "./schemas";

// A phrase boundary that also accepts punctuation: "בדוק מילה: reluctant" and
// "מה התשובה?" must match the same as the bare phrase. `\s` alone missed the colon
// and the question mark, so the typed form of the assistant's own example failed.
const EDGE_START = String.raw`(?:^|[\s:,.!?"'(])`;
const EDGE_END = String.raw`(?=$|[\s:,.!?"')])`;
const phrase = (alts: string, flags = "i") => new RegExp(`${EDGE_START}(?:${alts})${EDGE_END}`, flags);

const RE_HINT = phrase(String.raw`תנו?\s*לי\s*רמז|תן\s*לי\s*רמז|רמז\s*ראשון|רמז`);
const RE_NEXT = phrase(String.raw`רמז\s*נוסף|עוד\s*רמז|next\s*hint|another\s*hint`);
// "מה התשובה" - the learner wants the key, so the server may block it on a timed unit
// instead of silently answering with a stage-1 hint. "למה התשובה היא ב" stays question
// help: the boundary before "מה" is a letter there.
const RE_REVEAL = phrase(
  String.raw`גלה\s*תשובה|לגלות\s*תשובה|reveal|full\s*answer|התשובה\s*המלאה|תשובה\s*מלאה|מה\s*התשובה(?:\s*הנכונה)?|איזו\s*תשובה\s*נכונה|מהי\s*התשובה|what(?:'s|\s*is)\s*the\s*(?:correct\s*|right\s*)?answer|correct\s*answer`,
);
const RE_VOCAB_ACTION = phrase(String.raw`בדוק\s*מילה|בדיקת\s*מילה|אוצר\s*מילים|vocab(?:ulary)?\s*check`);
const RE_PERF = phrase(String.raw`נתח\s*(?:את\s*)?הביצועים|ביצועים\s*שלי|my\s*performance|analytics|ניתוח\s*ביצועים`);
const RE_REC = phrase(String.raw`מה\s*כדאי\s*לי|מה\s*לעשות\s*עכשיו|מה\s*כדאי\s*עכשיו|what\s*should\s*i\s*do|recommend|המלצ`);
/**
 * לוגיסטיקה = הרשמה/עלות/מועדים/מבנה רשמי בלבד. מילים כלליות כמו "מבחן"/"ציון"/"אמירנט"
 * מופיעות גם בשאלות תוכן ("איך ניגשים לשאלות במבחן?") - אסור שיחטפו את ה-intent.
 * הערה: \b של JS הוא ASCII בלבד ולא עובד אחרי עברית, לכן גבול מילה עברי ממומש
 * כ-lookbehind של "לא-אות" - כדי ש"בעלות"/"הניבה" לא יפעילו את "עלות"/ניב"ה.
 */
const HEB_BOUND = String.raw`(?<=^|[^֐-׾a-zA-Z])`;
// [ולבמהשכ]{0,3} - תחיליות שימוש (ו/ל/ב/מ/ה/ש/כ) אחרי גבול מילה, למשל "ההרשמה"/"ולמועדי"
const RE_LOGISTICS = new RegExp(
  HEB_BOUND +
    String.raw`[ולבמהשכ]{0,3}(?:הרשמה|נרשמים|רישום למבחן|כמה עולה|עלות המבחן|מחיר המבחן|מועדי? המבחן|מתי המבחן|איפה נבחנים|מיקומי המבחן|תוקף הציון|ציון עובר|פטור מאנגלית|מבנה המבחן|ניב["״]ה|nite\.org|בחינה חוזרת|retake)`,
  "i",
);
const RE_SIM = /סימולצ|simulation/i;
const RE_SC = /השלמ[הת]\s*משפט|sentence\s*completion|השלמה|חסר|ריק\s*\(/i;
const RE_REPHRASE = /ניסוח\s*מחדש|rephras|הפקה|מילים\s*נרדפות|synonym|מובן\s*שווה/i;
const RE_READ = /הבנ[הת]\s*הקטע|reading\s*comp|מאמר|קטע\s*הקריאה|main\s*idea|רעיון\s*מרכזי/i;
const RE_VOCAB_Q = /אוצר\s*מילים|תרגום\s*של|המילה|vocabulary|משמעות\s*המילה/i;

/**
 * Heuristic question-type guess for hint staging (no model call).
 */
export function inferQuestionTypeHeuristic(userMessage: string): AmirantQuestionType {
  const m = userMessage;
  if (RE_SIM.test(m)) return "simulation";
  if (RE_SC.test(m)) return "sentence_completion";
  if (RE_REPHRASE.test(m)) return "rephrasing";
  if (RE_READ.test(m)) return "reading_comprehension";
  if (RE_VOCAB_Q.test(m)) return "vocabulary";
  if (m.length > 40 && (m.includes("א.") || m.includes("ב.")) && m.includes("?")) {
    return "general_lesson";
  }
  return "general_lesson";
}

/**
 * Resolves final intent from explicit client action + message text.
 */
export function classifyChatIntent(
  request: AmirantChatbotRequest,
): { intent: AmirantChatIntent; explicitReveal: boolean } {
  const msg = request.userMessage ?? "";
  const action = (request.clientAction ?? "auto") as AmirantClientAction;

  if (action === "reveal" || RE_REVEAL.test(msg)) {
    return { intent: "reveal_answer", explicitReveal: true };
  }
  if (action === "vocab_lookup" || RE_VOCAB_ACTION.test(msg)) {
    return { intent: "vocabulary_lookup", explicitReveal: false };
  }
  if (action === "performance" || RE_PERF.test(msg)) {
    return { intent: "performance_analysis", explicitReveal: false };
  }
  if (action === "recommend" || RE_REC.test(msg)) {
    return { intent: "recommendation", explicitReveal: false };
  }
  if (action === "hint" || (action === "auto" && RE_HINT.test(msg) && !RE_NEXT.test(msg))) {
    return { intent: "staged_hint", explicitReveal: false };
  }
  if (action === "next_hint" || (action === "auto" && RE_NEXT.test(msg))) {
    return { intent: "staged_hint", explicitReveal: false };
  }

  if (action === "auto" && RE_LOGISTICS.test(msg) && msg.length < 500) {
    return { intent: "logistics", explicitReveal: false };
  }

  if (action === "auto" && (inferQuestionTypeHeuristic(msg) !== "general_lesson" || msg.length > 200)) {
    if (msg.includes("?") || msg.includes("א.")) {
      return { intent: "question_help", explicitReveal: false };
    }
  }

  if (action === "auto" && (msg.length > 120 || msg.includes("?"))) {
    return { intent: "question_help", explicitReveal: false };
  }

  return { intent: "general_course_help", explicitReveal: false };
}

/**
 * Staged hint: 1–3 = hints only, 4 = may reveal. Prefer explicit `stagedHintContext.stage` from the client
 * (increment after each "רמז נוסף"); if missing, `next_hint` defaults to stage 2.
 */
export function resolveStagedStage(
  request: AmirantChatbotRequest,
  intent: AmirantChatIntent,
): { stage: 1 | 2 | 3 | 4; isNext: boolean } {
  const fromClient = request.stagedHintContext?.stage;
  if (fromClient != null && fromClient >= 1 && fromClient <= 4) {
    return { stage: fromClient as 1 | 2 | 3 | 4, isNext: fromClient > 1 };
  }
  const action = request.clientAction ?? "auto";
  if (intent === "reveal_answer") {
    return { stage: 4, isNext: true };
  }
  if (action === "next_hint" || /רמז\s*נוסף|עוד\s*רמז|next\s*hint/i.test(request.userMessage)) {
    return { stage: 2, isNext: true };
  }
  if (action === "hint" || intent === "staged_hint" || intent === "question_help") {
    return { stage: 1, isNext: false };
  }
  return { stage: 1, isNext: false };
}

export function extractEnglishWordForVocab(userMessage: string, explicit?: string): string | null {
  if (explicit?.trim()) return explicit.trim().toLowerCase();
  const m = userMessage.match(/\b([a-zA-Z][a-zA-Z\-']{1,32})\b/g);
  if (m && m.length > 0) {
    return m.sort((a, b) => b.length - a.length)[0]!.toLowerCase();
  }
  return null;
}
