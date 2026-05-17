import type { PremiumSectionVariant } from "./split-markdown-lesson";

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
  const flat = source.flatMap((b) => chunkStringToMax(b, maxChars));
  if (flat.length === 0) {
    return [raw];
  }
  return flat;
}

/** Strip unit prefixes so sidebar titles read naturally in Hebrew. */
export function cleanLessonStepSectionTitle(title: string): string {
  let t = title.replace(/\s+/g, " ").trim();
  t = t.replace(/^unit\s*\d+[:\s.\-–—]+\s*/i, "");
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
  const t = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (last > 24) return cut.slice(0, last + 1);
  return cut + "…";
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
 * Prefer splitting on `##` headings so each step maps to a real subsection.
 * Long subsections are chunked with a stable "· המשך" suffix (no `1/3` style).
 */
export function splitBodyIntoSemanticMicroParts(
  body: string,
  maxChars: number,
  sectionTitle: string,
): { body: string; stepLabel: string }[] {
  const raw = body.trim();
  if (!raw) return [];

  const cleanedSection = cleanLessonStepSectionTitle(sectionTitle);
  const hasH2 = /^##\s+/m.test(raw);

  if (!hasH2) {
    const parts = splitBodyIntoMicroParts(raw, maxChars);
    return parts.map((b, i) => ({
      body: b,
      stepLabel: labelForFlatChunk(b, cleanedSection, i, parts.length),
    }));
  }

  const segments = raw.split(/(?=^##\s+)/m).map((s) => s.trim()).filter(Boolean);
  const out: { body: string; stepLabel: string }[] = [];

  for (const seg of segments) {
    const lines = seg.split("\n");
    const first = lines[0]?.trim() ?? "";
    const hm = first.match(/^##\s+(.+)$/);
    if (!hm) {
      const chunks = splitBodyIntoMicroParts(seg, maxChars);
      chunks.forEach((b, j) =>
        out.push({
          body: b,
          stepLabel: labelForFlatChunk(b, cleanedSection, j, chunks.length),
        }),
      );
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

    const sub = chunkStringToMax(rest, maxChars);
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
  if (total === 1) return shortenLabel(cleanedSection);
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
    return hasBody ? shortenLabel(`${base} — פירוט`) : shortenLabel(base);
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
  /** Sidebar + main column H2 — derived from headings / content, not `2/3` splits. */
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
