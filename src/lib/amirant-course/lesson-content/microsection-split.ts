import { markdownishToPlain, type PremiumSectionVariant } from "./split-markdown-lesson";

/** Tuned for ~3–4 short lines per card (avoids “document” walls). */
export const DEFAULT_MICRO_CARD_CHARS = 300;
const LIST_SLICE = 4;

/**
 * יחידת תת-כותרת (דוגמה/מלכודת/רמז) עד גודל זה נשארת שקופית אחת שלמה.
 * הוגדל לפי משוב הבודקת: שאלה + 4 אפשרויות + ניתוח מלא חייבים להישאר יחד
 * ("מעולה שיש השאלה והתשובה ביחד באותה שקופית").
 */
const WHOLE_SUBSECTION_CHARS = 2400;

const MAX_STEP_LABEL = 56;

const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;

function isFenceBlock(block: string): boolean {
  return FENCE_OPEN.test(block.trimStart());
}

/**
 * מפרק טקסט לבלוקים אטומיים: גדר קוד (```…```) היא בלוק אחד גם כשיש בתוכה
 * שורות ריקות - פיצול בתוכה השאיר ``` פתוח שהפך את שאר השקופית לקוד גולמי
 * (אפשרות D "קפצה" והניתוח הוצג עם ** מילולי - משוב הבודקת). שאר התוכן
 * מפוצל בשורות ריקות.
 */
export function splitIntoAtomicBlocks(raw: string): string[] {
  const lines = raw.split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];
  let inFence = false;
  const flush = () => {
    const t = buf.join("\n").trim();
    if (t) blocks.push(t);
    buf = [];
  };
  for (const line of lines) {
    if (!inFence && FENCE_OPEN.test(line)) {
      flush();
      inFence = true;
      buf.push(line);
      continue;
    }
    if (inFence) {
      buf.push(line);
      if (FENCE_OPEN.test(line) && buf.length > 1) {
        inFence = false;
        flush();
      }
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

/**
 * Splits a long prose block to segments ≤ max. Cuts only at sentence ends
 * (., !, ?) when possible - a cut mid-sentence ("creates a…") reads as a bug
 * (משוב הבודקת על קטעי הקריאה). Falls back to newline, then space.
 */
function chunkStringToMax(s: string, maxChars: number): string[] {
  const t = s.trim();
  if (!t) return [];
  if (t.length <= maxChars) {
    return [s];
  }
  const out: string[] = [];
  let rest = t;
  while (rest.length) {
    if (rest.length <= maxChars) {
      out.push(rest);
      break;
    }
    const win = rest.slice(0, maxChars);
    let cut = -1;
    for (const re of [/[.!?…](?=\s)/g]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(win)) !== null) {
        if (m.index + 1 > cut) cut = m.index + 1;
      }
    }
    if (cut <= Math.floor(maxChars * 0.3)) {
      const nl = win.lastIndexOf("\n");
      const sp = win.lastIndexOf(" ");
      if (nl > Math.floor(maxChars * 0.35)) {
        cut = nl;
      } else if (sp > Math.floor(maxChars * 0.45)) {
        cut = sp;
      } else {
        cut = maxChars;
      }
    }
    const part = rest.slice(0, cut).trim();
    if (part.length) out.push(part);
    const next = rest.slice(cut).trim();
    if (!next.length) break;
    rest = next;
  }
  return out;
}

function isMarkdownTable(block: string): boolean {
  const lines = block.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return false;
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  return tableLines.length >= 2;
}

/** רשימת markdown (בולטים/מספור/צ'קבוקסים) - לא נחתכת באמצע פריט. */
function isMarkdownList(block: string): boolean {
  const lines = block.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return false;
  const listLines = lines.filter((l) => /^\s*(?:[-*+•]|\d+\.)\s/.test(l));
  return listLines.length >= Math.ceil(lines.length * 0.6);
}

/** בלוק שאסור לחתוך באמצעו: גדר קוד, טבלה, או רשימה בגודל סביר. */
function isAtomicBlock(block: string): boolean {
  return (
    isFenceBlock(block) ||
    isMarkdownTable(block) ||
    (isMarkdownList(block) && block.length <= WHOLE_SUBSECTION_CHARS)
  );
}

export function splitBodyIntoMicroParts(
  body: string,
  maxChars = DEFAULT_MICRO_CARD_CHARS,
): string[] {
  const raw = body.trim();
  if (!raw) {
    return [body];
  }
  const blocks = splitIntoAtomicBlocks(raw);
  const source = blocks.length ? blocks : [raw];
  const flat = source.flatMap((b) =>
    isAtomicBlock(b) || b.length <= maxChars ? [b] : chunkStringToMax(b, maxChars),
  );
  if (flat.length === 0) {
    return [raw];
  }
  return flat;
}

/** Strip unit prefixes so sidebar titles read naturally in Hebrew. */
export function cleanLessonStepSectionTitle(title: string): string {
  let t = title.replace(/\s+/g, " ").trim();
  t = t.replace(/^unit\s*\d+[:\s.\-–-]+\s*/i, "");
  t = t.replace(/^יחידה\s*[\d.]+\s*[:\s]+/, "");
  return t.trim() || title.trim();
}

/** Visible heading text from a markdown ## line (no #, light cleanup). */
export function cleanStepHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/^[🎯📌✅💡⚠️]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenLabel(s: string, n = MAX_STEP_LABEL): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function extractFirstHeadingFromBody(body: string): string | null {
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^#{1,6}\s+(.+)$/);
    if (m?.[1]) return cleanLessonStepSectionTitle(cleanStepHeading(m[1]));
  }
  return null;
}

function excerptPlainOpening(body: string, maxLen: number): string | null {
  // המנקה המרכזי מסיר גם שורות טבלה ואימוג'י - תווית צעד לעולם לא תציג markdown גולמי.
  const t = markdownishToPlain(body, maxLen);
  return t || null;
}

function titlesLooselyEqual(a: string, b: string): boolean {
  const x = a.replace(/\s+/g, " ").trim().toLowerCase();
  const y = b.replace(/\s+/g, " ").trim().toLowerCase();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 10 && y.length >= 10 && (x.includes(y) || y.includes(x))) return true;
  return false;
}

/**
 * Prefer splitting on the shallowest heading level present (`##`→`###`→`####`),
 * recursing into deeper levels inside long subsections - a step never straddles
 * a heading boundary (fix: הסבר של רמז א' זלג לכרטיס של רמז ב' והפך לכותרתו).
 * Long flat runs are chunked with a stable "· המשך" suffix (no `1/3` style).
 * Heading detection is block-based - a `###` inside a code fence is not a split point.
 */
export function splitBodyIntoSemanticMicroParts(
  body: string,
  maxChars: number,
  sectionTitle: string,
): { body: string; stepLabel: string }[] {
  return splitAtHeadingLevels(body, maxChars, cleanLessonStepSectionTitle(sectionTitle), [
    "##",
    "###",
    "####",
  ]);
}

type HeadingSegment = { headingLine: string | null; blocks: string[] };

function groupBlocksByHeading(blocks: string[], marker: string): HeadingSegment[] {
  const headingRe = new RegExp(`^${marker}\\s+`);
  const segments: HeadingSegment[] = [];
  let current: HeadingSegment | null = null;
  for (const block of blocks) {
    const firstLine = block.split("\n")[0] ?? "";
    if (!isFenceBlock(block) && headingRe.test(firstLine.trim())) {
      if (current) segments.push(current);
      const restOfBlock = block.split("\n").slice(1).join("\n").trim();
      current = { headingLine: firstLine.trim(), blocks: restOfBlock ? [restOfBlock] : [] };
      continue;
    }
    if (!current) {
      current = { headingLine: null, blocks: [block] };
      continue;
    }
    current.blocks.push(block);
  }
  if (current) segments.push(current);
  return segments;
}

function blocksHaveHeading(blocks: string[], marker: string): boolean {
  const headingRe = new RegExp(`^${marker}\\s+`);
  return blocks.some((b) => !isFenceBlock(b) && headingRe.test((b.split("\n")[0] ?? "").trim()));
}

function splitAtHeadingLevels(
  body: string,
  maxChars: number,
  cleanedSection: string,
  levels: string[],
): { body: string; stepLabel: string }[] {
  const raw = body.trim();
  if (!raw) return [];

  const blocks = splitIntoAtomicBlocks(raw);
  const levelIdx = levels.findIndex((m) => blocksHaveHeading(blocks, m));
  if (levelIdx === -1) {
    const parts = splitBodyIntoMicroParts(raw, maxChars);
    return parts.map((b, i) => ({
      body: b,
      stepLabel: labelForFlatChunk(b, cleanedSection, i, parts.length),
    }));
  }

  const marker = levels[levelIdx]!;
  const deeper = levels.slice(levelIdx + 1);
  const segments = groupBlocksByHeading(blocks, marker);
  const out: { body: string; stepLabel: string }[] = [];

  for (const seg of segments) {
    const rest = seg.blocks.join("\n\n").trim();
    if (seg.headingLine === null) {
      // פתיח לפני הכותרת הראשונה - עדיין עשוי להכיל כותרות עמוקות יותר
      out.push(...splitAtHeadingLevels(rest, maxChars, cleanedSection, deeper));
      continue;
    }

    const hm = seg.headingLine.match(new RegExp(`^${marker}\\s+(.+)$`));
    const headingPlain = shortenLabel(
      cleanLessonStepSectionTitle(cleanStepHeading(hm?.[1] ?? seg.headingLine)),
    );
    if (!rest) {
      continue;
    }

    const combined = `${seg.headingLine}\n${rest}`;
    const hasDeeperHeading = deeper.some((m) => blocksHaveHeading(seg.blocks, m));
    // יחידת-עלה (דוגמה/מלכודת/רמז) נשארת שקופית אחת שלמה עד תקרה נדיבה -
    // "שקופית לכל מלכודת, עם הדוגמה שלה" (משוב הבודקת)
    if (combined.length <= (hasDeeperHeading ? maxChars : WHOLE_SUBSECTION_CHARS)) {
      out.push({ body: combined, stepLabel: headingPlain });
      continue;
    }
    if (hasDeeperHeading) {
      const kids = splitAtHeadingLevels(rest, maxChars, headingPlain, deeper);
      kids.forEach((kid, j) => {
        // שורת הכותרת של האב נצמדת לילד הראשון (הפתיח שלו)
        out.push(j === 0 ? { body: `${seg.headingLine}\n${kid.body}`, stepLabel: kid.stepLabel } : kid);
      });
      continue;
    }

    const sub = splitBodyIntoMicroParts(rest, maxChars);
    sub.forEach((chunk, j) => {
      const pieceBody = j === 0 ? `${seg.headingLine}\n${chunk}` : chunk;
      const lab = j === 0 ? headingPlain : shortenLabel(`${headingPlain} · המשך`);
      out.push({ body: pieceBody, stepLabel: lab });
    });
  }

  if (out.length === 0) {
    const parts = splitBodyIntoMicroParts(raw, maxChars);
    return parts.map((b, i) => ({
      body: b,
      stepLabel: labelForFlatChunk(b, cleanedSection, i, parts.length),
    }));
  }

  return out;
}

function labelForFlatChunk(
  body: string,
  cleanedSection: string,
  index: number,
  total: number,
): string {
  // הצ'אנק הראשון מייצג את פתיחת הסקשן - כותרת הסקשן ולא excerpt
  if (total === 1 || index === 0) return shortenLabel(cleanedSection);
  const fromHeading = extractFirstHeadingFromBody(body);
  if (fromHeading && !titlesLooselyEqual(fromHeading, cleanedSection)) {
    return shortenLabel(fromHeading);
  }
  const snippet = excerptPlainOpening(body, 48);
  if (snippet && !titlesLooselyEqual(snippet, cleanedSection)) {
    return shortenLabel(snippet);
  }
  return index === 0 ? shortenLabel(cleanedSection) : shortenLabel(`${cleanedSection} · המשך`);
}

function listGroupStepLabel(
  sectionTitle: string,
  group: string[],
  _groupIndex: number,
  groupCount: number,
  hasBody: boolean,
): string {
  const base = cleanLessonStepSectionTitle(sectionTitle);
  if (groupCount === 1) {
    return hasBody ? shortenLabel(`${base} - פירוט`) : shortenLabel(base);
  }
  const hint = group[0]?.replace(/\s+/g, " ").trim() ?? "";
  return hint ? shortenLabel(hint, 52) : shortenLabel(base);
}

/** גוף שהוא רק קווי הפרדה (`---`) - סקשן "ריק" שיוצר שקופית בלי תוכן (משוב: "עמוד מיותר"). */
function isSeparatorOnlyBody(body: string | undefined): boolean {
  const t = body?.trim() ?? "";
  return t.length > 0 && /^[-*_\s–—]+$/.test(t);
}

function dedupeExpandedCards(cards: ExpandedLessonCard[]): ExpandedLessonCard[] {
  const out: ExpandedLessonCard[] = [];
  for (const c of cards) {
    const bodyMissing = !c.body?.trim() || isSeparatorOnlyBody(c.body);
    const empty = bodyMissing && !(c.items && c.items.length) && !(c.bullets && c.bullets.length);
    if (empty) continue;
    const prev = out[out.length - 1];
    if (
      prev &&
      c.body?.trim() &&
      c.body.trim() === prev.body?.trim() &&
      !c.items?.length &&
      !c.bullets?.length &&
      !prev.items?.length &&
      !prev.bullets?.length
    ) {
      continue;
    }
    out.push(c);
  }
  return out;
}

export type ExpandedLessonCard = {
  key: string;
  /** Legacy card title; keep in sync with stepLabel for tooling. */
  title: string;
  /** Sidebar + main column H2 - derived from headings / content, not `2/3` splits. */
  stepLabel: string;
  variant: PremiumSectionVariant;
  body?: string;
  items?: string[];
  bullets?: string[];
};

function chunkList<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [];
  const o: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    o.push(arr.slice(i, i + size));
  }
  return o;
}

/**
 * One “section” → one or more cards (body) + list slices, no giant bullet walls.
 */
export function expandSectionFlowToLessonCards(item: {
  id: string;
  title: string;
  variant: PremiumSectionVariant;
  body?: string;
  bullets?: string[];
  items?: string[];
}): ExpandedLessonCard[] {
  const out: ExpandedLessonCard[] = [];
  const hasBody = Boolean(item.body?.trim());
  const hasList = (item.items && item.items.length > 0) || (item.bullets && item.bullets.length > 0);

  if (hasBody) {
    const parts = splitBodyIntoSemanticMicroParts(item.body!, DEFAULT_MICRO_CARD_CHARS, item.title);
    parts.forEach((part, i) => {
      out.push({
        key: `${item.id}--b${i}`,
        title: part.stepLabel,
        stepLabel: part.stepLabel,
        variant: item.variant,
        body: part.body,
      });
    });
  }

  if (hasList) {
    if (item.items && item.items.length) {
      const groups = chunkList(item.items, LIST_SLICE);
      groups.forEach((group, g) => {
        const stepLabel = listGroupStepLabel(item.title, group, g, groups.length, hasBody);
        out.push({
          key: `${item.id}--it${g}`,
          title: stepLabel,
          stepLabel,
          variant: item.variant,
          items: group,
        });
      });
    } else if (item.bullets && item.bullets.length) {
      const groups = chunkList(item.bullets, LIST_SLICE);
      groups.forEach((group, g) => {
        const stepLabel = listGroupStepLabel(item.title, group, g, groups.length, hasBody);
        out.push({
          key: `${item.id}--ul${g}`,
          title: stepLabel,
          stepLabel,
          variant: item.variant,
          bullets: group,
        });
      });
    }
  }

  return dedupeExpandedCards(out);
}
