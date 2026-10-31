const CLAIM_PATTERNS: RegExp[] = [
  /(?:score|accuracy|percent|progress|completion|level|שגיאות|מספר\s*הטעויות|טעויות|mistake|errors?|topics?|נושאים|ציון|דיוק|אחוז|התקדמות|סה[\"״]כ|סה"כ|סה״כ)\s*[:=]?\s*(\d+(?:\.\d+)?)/gi,
  /(\d+(?:\.\d+)?)\s*%/g,
  /(\d+(?:\.\d+)?)\s*(?:טעויות|שגיאות|mistake|errors?|topics?|נושאים)/gi,
  /(\d+(?:\.\d+)?)\s*(?:out of|מתוך)\s*(\d+(?:\.\d+)?)/gi,
];

function normalizeNumberToken(token: string): string {
  const n = Number(token);
  if (Number.isNaN(n)) return token;
  return String(Math.round(n * 1000) / 1000);
}

function extractClaimNumbers(text: string): string[] {
  const out: string[] = [];
  for (const pattern of CLAIM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      for (let i = 1; i < match.length; i++) {
        const token = match[i];
        if (!token) continue;
        out.push(normalizeNumberToken(token));
      }
    }
  }
  return out;
}

function collectAllowedNumbers(snapshots: unknown[]): Set<string> {
  const set = new Set<string>();
  for (const snap of snapshots) {
    const text = JSON.stringify(snap ?? {});
    for (const token of text.match(/-?\d+(?:\.\d+)?/g) ?? []) {
      set.add(normalizeNumberToken(token));
    }
  }
  return set;
}

/**
 * Prompt-injection / role-override attempts. The assistant is a paid course feature:
 * a learner asking it to "ignore the instructions" or dump its system prompt gets a
 * short Hebrew refusal without a model call.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|the\s+|your\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|prompts?|rules)/i,
  /disregard\s+(?:all\s+|the\s+|your\s+)?(?:previous|prior|above)\s+(?:instructions|rules)/i,
  /(?:reveal|show|print|repeat|dump|output)\s+(?:me\s+)?(?:your|the)\s+(?:system\s+prompt|hidden\s+prompt|instructions|rules)/i,
  /\bsystem\s*prompt\b/i,
  /\byou\s+are\s+now\s+(?:a|an|in)\b/i,
  /\b(?:DAN|developer)\s+mode\b/i,
  /jailbreak/i,
  // "התעלם מההנחיות / מההוראות / מהכללים / מכל ההוראות הקודמות"
  /(?:תתעלם|התעלם|התעלמי|תתעלמי|תתעלמו|התעלמו)\s+מ(?:כל\s+)?(?:ה)?(?:הוראות|הנחיות|כללים|חוקים)/,
  /(?:הצג|תראה|תראי|גלה|תגלה)\s+(?:לי\s+)?את\s+(?:ה)?(?:הנחיות|הוראות)\s+(?:של\s+)?(?:ה)?(?:מערכת|שלך)/,
  /(?:פרומפט|prompt)\s+(?:ה)?מערכת/i,
  /מעכשיו\s+את[הם]?\s+(?:לא\s+)?(?:עוזר|בוט|מודל)/,
];

export type LearnerMessageScreen =
  | { ok: true }
  | { ok: false; reason: "injection"; answerHe: string };

/** Returns a deterministic Hebrew answer for messages that try to override the assistant. */
export function screenLearnerMessage(text: string): LearnerMessageScreen {
  const t = String(text ?? "");
  if (INJECTION_PATTERNS.some((re) => re.test(t))) {
    return {
      ok: false,
      reason: "injection",
      answerHe:
        "אני עוזר הלימוד של קורס האמירנ״ט ועונה רק על שאלות שקשורות ללימוד: תוכן השיעור, שאלות תרגול, אסטרטגיה ואוצר מילים. על מה בשיעור לעזור?",
    };
  }
  return { ok: true };
}

/**
 * Personal data the learner might paste by accident: Israeli ID (9 digits), payment
 * card numbers, phone numbers, email addresses. Redacted before the prompt and before
 * the insight log. Four-digit-or-shorter numbers (scores, years) are untouched.
 */
const PII_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b(?:\d[ -]?){13,19}\b/g, label: "[כרטיס הוסר]" },
  { re: /\b\d{9}\b/g, label: "[ת.ז. הוסרה]" },
  { re: /(?:\+972|0)(?:[ -]?\d){8,9}\b/g, label: "[טלפון הוסר]" },
  { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, label: "[אימייל הוסר]" },
];

export function redactPersonalData(text: string): string {
  let out = String(text ?? "");
  for (const { re, label } of PII_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, label);
  }
  return out;
}

export function validateAiGroundedNumericClaims(params: {
  texts: string[];
  allowedSnapshots: unknown[];
}): { ok: boolean; violations: string[] } {
  const allowed = collectAllowedNumbers(params.allowedSnapshots);
  const violations = new Set<string>();
  for (const text of params.texts) {
    for (const token of extractClaimNumbers(String(text ?? ""))) {
      if (!allowed.has(token)) violations.add(token);
    }
  }
  return {
    ok: violations.size === 0,
    violations: Array.from(violations),
  };
}
