/**
 * מפרק גוף Markdown לשיעור לקטעים (##) + מבוא - ל-UX פרימיום בלי לשנות תוכן.
 */

export type PremiumSectionVariant =
  | "explanation"
  | "example"
  | "insight"
  | "tip"
  | "warning"
  | "common-mistake"
  | "key-takeaway";

export type PremiumMarkdownSection = {
  id: string;
  heading: string;
  body: string;
  variant: PremiumSectionVariant;
};

export type MarkdownFlowItem = PremiumMarkdownSection | { kind: "gate" };

export function interleaveMarkdownGates(sections: PremiumMarkdownSection[]): MarkdownFlowItem[] {
  const out: MarkdownFlowItem[] = [];
  sections.forEach((s, i) => {
    out.push(s);
    if (i % 2 === 1 && i < sections.length - 1) {
      out.push({ kind: "gate" });
    }
  });
  return out;
}

export function guessSectionVariant(heading: string): PremiumSectionVariant {
  const h = heading.toLowerCase();
  if (/טעות נפוצ|מטעות נפוצ|common mistake|pitfall|שגיאה אופיינ|טעויות שכיח|טעויות נפוצ|שגיא(ים)? נפוצ/.test(heading) || /טעויות נפוצ/.test(heading)) {
    return "common-mistake";
  }
  if (/טיפ|tip|💡|remember|note:/.test(heading) || /💡/.test(heading)) {
    return "tip";
  }
  // אימוג'י 🎯/📌 לבדו אינו טריגר: כותרות כמו "דוגמה מודרכת מלאה 🎯" קיבלו
  // תווית "מה חשוב לזכור" על שקופיות של קטע קריאה (משוב הבודקת)
  if (/לסיכום|סיכום|מה חשוב|key|takeaway|נקודות מפתח|עיקר|לזכור|תזכורת/.test(heading)) {
    return "key-takeaway";
  }
  if (/דוגמ|example|for example|sample|illustrat|תרחיש|מקרה בוחן/.test(h)) {
    return "example";
  }
  if (/תובנה|insight|מבט( עומק)?|הבהרה|הדגש(ה)?/.test(heading) || /insight/i.test(heading)) {
    return "insight";
  }
  if (/אזהרה|שגיא|טעות|warning|⚠|caution|error(?!:)/.test(heading) || /⚠/.test(heading)) {
    return "warning";
  }
  return "explanation";
}

/** הסרת הדגשת markdown עדכנית לשורת מבוא קצרה. */
export function markdownishToPlain(text: string, maxLen: number): string {
  const t = text
    .replace(/\r\n/g, "\n")
    .replace(/^#+\s+/gm, "")
    .replace(/^\s*-{3,}\s*$/gm, "") // קווי הפרדה (---) של markdown אינם טקסט
    .replace(/^\s*\|.*\|\s*$/gm, "") // שורות טבלה (| ... |) אינן פרוזה - בתקציר הן זבל
    .replace(/^>\s?/gm, "")
    .replace(/^\s*(?:[-*+•]|\d+\.)\s+/gm, "")
    .replace(/\[[ xX]\]\s*/g, "") // סמני צ'קבוקס GFM - "[ ]" מילולי אינו טקסט תקציר/תווית
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // אימוג'י ופיקטוגרמות מתוכן המקור - לא בשורת מבוא (זוגות surrogate + טווחי BMP)
    .replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2600-\u27BF\u2B00-\u2BFF\u2190-\u21FF\uFE0F\u200D]/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-{3,}\s*$/, "")
    .trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (last > 50) return cut.slice(0, last + 1) + "…";
  return cut + "…";
}

function parseH2Chunk(chunk: string, index: number): PremiumMarkdownSection {
  const lines = chunk.trim().split("\n");
  const first = lines[0] ?? "";
  const heading = first.replace(/^##\s+/, "").trim();
  const body = lines.slice(1).join("\n").trim();
  return {
    id: `s-${index}`,
    heading: heading || `קטע ${index + 1}`,
    body,
    variant: guessSectionVariant(heading),
  };
}

export function splitMarkdownIntoSections(raw: string, lessonTitle: string): { intro: string; sections: PremiumMarkdownSection[] } {
  const text = raw.trim();
  if (!text) {
    return { intro: "", sections: [] };
  }

  const hasH2 = /^##\s+/m.test(text);
  if (!hasH2) {
    const body = text.replace(/^#\s+[^\n]+\n?/m, "").trim();
    return {
      intro: body ? markdownishToPlain(body, 360) : "",
      sections: [
        {
          id: "s-0",
          heading: lessonTitle,
          body,
          variant: "explanation",
        },
      ],
    };
  }

  const parts = text.split(/(?=^##\s+)/m);
  let preamble = "";
  const h2parts: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    if (/^##\s+/.test(t)) h2parts.push(t);
    else preamble = t.replace(/^#\s+[^\n]+\n?/m, "").trim();
  }

  const sections: PremiumMarkdownSection[] = h2parts.map((chunk, i) => parseH2Chunk(chunk, i));
  const intro = markdownishToPlain(preamble || (sections[0]?.body?.slice(0, 800) ?? ""), 360);

  return { intro, sections };
}
