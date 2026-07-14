import { markdownishToPlain, type PremiumSectionVariant } from "./split-markdown-lesson";

/** Tuned for ~3–4 short lines per card (avoids “document” walls). */
export const DEFAULT_MICRO_CARD_CHARS = 300;
const LIST_SLICE = 4;

const MAX_STEP_LABEL = 56;

/**
 * Splits a string to segments ≤ max, preferring last space in the window.
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
    let cut = maxChars;
    const sp = win.lastIndexOf(" ");
    if (sp > Math.floor(maxChars * 0.45)) {
      cut = sp;
    }
    const part = rest.slice(0, cut).trim();
    if (part.length) out.push(part);
    const next = rest.slice(cut).trim();
    if (!next.length) break;
    rest = next;
  }
  return out;
}

/**
 * Splits body into many short text blocks: paragraphs first, then chunks at `maxChars` (word-spaced when possible).
 * Produces as many small cards as needed (no text dropped).
 */
function isMarkdownTable(block: string): boolean {
  const lines = block.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return false;
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  return tableLines.length >= 2;
}

export function splitBodyIntoMicroParts(
  body: string,
  maxChars = DEFAULT_MICRO_CARD_CHARS,
): string[] {
  const raw = body.trim();
  if (!raw) {
    return [body];
  }
  const blocks = raw.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const source = blocks.length ? blocks : [raw];
  // Keep markdown tables atomic - chunkStringToMax would break them mid-row
  const flat = source.flatMap((b) => isMarkdownTable(b) ? [b] : chunkStringToMax(b, maxChars));
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

function splitAtHeadingLevels(
  body: string,
  maxChars: number,
  cleanedSection: string,
  levels: string[],
): { body: string; stepLabel: string }[] {
  const raw = body.trim();
  if (!raw) return [];

  const levelIdx = levels.findIndex((m) => new RegExp(`^${m}\\s+`, "m").test(raw));
  if (levelIdx === -1) {
    const parts = splitBodyIntoMicroParts(raw, maxChars);
    return parts.map((b, i) => ({
      body: b,
      stepLabel: labelForFlatChunk(b, cleanedSection, i, parts.length),
    }));
  }

  const marker = levels[levelIdx]!;
  const deeper = levels.slice(levelIdx + 1);
  const segments = raw
    .split(new RegExp(`(?=^${marker}\\s+)`, "m"))
    .map((s) => s.trim())
    .filter(Boolean);
  const out: { body: string; stepLabel: string }[] = [];

  for (const seg of segments) {
    const lines = seg.split("\n");
    const first = lines[0]?.trim() ?? "";
    const hm = first.match(new RegExp(`^${marker}\\s+(.+)$`));
    if (!hm) {
      // פתיח לפני הכותרת הראשונה - עדיין עשוי להכיל כותרות עמוקות יותר
      out.push(...splitAtHeadingLevels(seg, maxChars, cleanedSection, deeper));
      continue;
    }

    const headingPlain = shortenLabel(cleanLessonStepSectionTitle(cleanStepHeading(hm[1]!)));
    const rest = lines.slice(1).join("\n").trim();
    if (!rest.trim()) {
      continue;
    }

    const combined = `${first}\n${rest}`;
    if (combined.length <= maxChars) {
      out.push({ body: combined, stepLabel: headingPlain });
      continue;
    }

    const hasDeeperHeading = deeper.some((m) => new RegExp(`^${m}\\s+`, "m").test(rest));
    if (hasDeeperHeading) {
      const kids = splitAtHeadingLevels(rest, maxChars, headingPlain, deeper);
      kids.forEach((kid, j) => {
        // שורת הכותרת של האב נצמדת לילד הראשון (הפתיח שלו)
        out.push(j === 0 ? { body: `${first}\n${kid.body}`, stepLabel: kid.stepLabel } : kid);
      });
      continue;
    }

    const sub = isMarkdownTable(rest) ? [rest] : chunkStringToMax(rest, maxChars);
    sub.forEach((chunk, j) => {
      const pieceBody = j === 0 ? `${first}\n${chunk}` : chunk;
      const lab =
        j === 0 ? headingPlain : shortenLabel(`${headingPlain} · המשך`);
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

function dedupeExpandedCards(cards: ExpandedLessonCard[]): ExpandedLessonCard[] {
  const out: ExpandedLessonCard[] = [];
  for (const c of cards) {
    const empty = !c.body?.trim() && !(c.items && c.items.length) && !(c.bullets && c.bullets.length);
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
