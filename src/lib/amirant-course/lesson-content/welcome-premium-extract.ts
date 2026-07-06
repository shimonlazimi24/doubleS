/**
 * Structured Unit 1.1 (welcome) for premium step rendering — no new facts.
 */

export type ScoreRangeRow = { range: string; meaning: string; detail: string };
export type CourseUnitRow = { n: string; title: string };
export type GoldenRule = { n: number; text: string };
export type ExamQuestionTypeRow = { n: string; type: string; count: string; time: string };

export type OpenPremiumData = { intro: string; highlight: string };
export type WhyPremiumData = { lede: string; goal: string; scoreRows: ScoreRangeRow[] };
export type WhatPremiumData = { units: CourseUnitRow[]; bonusTitle: string; bonusItems: string[] };
export type SuccessPremiumData = { rules: GoldenRule[] };
export type ExamPremiumData = {
  lede: string;
  nameLabel: string;
  nameText: string;
  structureTitle: string;
  structureBullets: string[];
  durationLine: string;
  questionTableTitle: string;
  questionRows: ExamQuestionTypeRow[];
  scoreTitle: string;
  scoreBullets: string[];
  adaptiveTitle: string;
  adaptiveText: string;
  reform?: { title: string; p1Label: string; p1Text: string; p2Label: string; p2Text: string; p3: string };
};
export type ClosingPremiumData = {
  nextTitle: string;
  nextItems: string[];
  giftTitle: string;
  giftItems: string[];
  closing: string;
};

export type WelcomeStepPayload =
  | { step: "open"; data: OpenPremiumData }
  | { step: "why"; data: WhyPremiumData }
  | { step: "what"; data: WhatPremiumData }
  | { step: "success"; data: SuccessPremiumData }
  | { step: "exam"; data: ExamPremiumData }
  | { step: "closing"; data: ClosingPremiumData };

function stripFences(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/^---+\s*$/gm, "").trim();
}

export function stripUnitMeta(s: string): string {
  let t = s.replace(/\r\n/g, "\n");
  const block =
    /(?:^|\n)(?:\*\*משך יחידה משוער:\*\*[^\n]*\n?)(?:\*\*קבצים ביחידה:\*\*[^\n]*\n?)?(?:\*\*רמה נדרשת:\*\*[^\n]*\n?)?/g;
  t = t.replace(block, "\n");
  t = t.replace(/(?:^|\n)#{1,6}\s*Unit\s*1:.*\n?/gim, "\n");
  t = stripFences(t);
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function dedupeParagraphs(text: string): string {
  const paras = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of paras) {
    const n = p.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    if (out.length && n === out[out.length - 1]!.replace(/\*\*/g, "").replace(/\s+/g, " ").trim()) continue;
    out.push(p);
  }
  return out.join("\n\n");
}

function extractBlockquote(t: string): { before: string; quote: string; after: string } {
  const s = t.replace(/\r\n/g, "\n");
  const lines = s.split("\n");
  let start = -1;
  const bq: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim().startsWith(">")) {
      if (start < 0) start = i;
      bq.push(line.replace(/^\s*>\s?/, ""));
    } else if (start >= 0) break;
  }
  if (start < 0) return { before: s.trim(), quote: "", after: "" };
  return {
    before: lines.slice(0, start).join("\n").trim(),
    quote: bq.join("\n").trim(),
    after: lines.slice(start + bq.length).join("\n").trim(),
  };
}

export function parseOpenPremium(pageIntro: string, meva: string[], welcome: string[]): OpenPremiumData {
  const segs = [pageIntro, ...meva, ...welcome].map((p) => stripUnitMeta(p).trim()).filter(Boolean);
  const combined = dedupeParagraphs(segs.join("\n\n"));
  const { before, quote, after } = extractBlockquote(combined);
  if (!quote) return { intro: combined, highlight: "" };
  const intro = dedupeParagraphs([before, after].filter(Boolean).join("\n\n").replace(/\n{2,}/g, "\n\n").trim());
  return { intro, highlight: quote };
}

export function parseWhyPremium(whyBody: string): WhyPremiumData {
  const t = stripFences(whyBody.replace(/\r\n/g, "\n"));
  const i1 = t.indexOf("\n| ציון |");
  const i2 = t.indexOf("\n|");
  const tableStart = i1 >= 0 ? i1 : i2;
  const lede = (tableStart > 0 ? t.slice(0, tableStart) : t.split("**המטרה שלכם")[0] || t)
    .replace(/\n+$/g, "")
    .trim();
  const goal =
    t
      .split(/\n\n/)
      .map((p) => p.trim())
      .find((p) => p.startsWith("**המטרה")) ?? "";
  const scoreRows: ScoreRangeRow[] = [];
  for (const line of t.split("\n").map((l) => l.trim())) {
    if (!line.startsWith("|")) continue;
    if (/^\|[-\s|]+\|?$/.test(line)) continue;
    const c = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (c.length < 2 || /^ציון$|משמעות$/i.test(c[0]!)) continue;
    scoreRows.push({ range: c[0]!, meaning: c[1] ?? "", detail: c[2] ?? "" });
  }
  return { lede, goal, scoreRows: scoreRows.filter((r) => r.range) };
}

export function parseWhatPremium(whatBody: string): WhatPremiumData {
  const t = stripFences(whatBody.replace(/\r\n/g, "\n"));
  const unitM = t.match(/###\s*10 יחידות לימוד מובנות:\s*([\s\S]*?)(?=###\s*מה בנוסף)/i);
  const units: CourseUnitRow[] = [];
  if (unitM) {
    for (const line of unitM[1]!.split("\n")) {
      const s = line.trim();
      if (!/^\d+\./.test(s)) continue;
      const n = s.match(/^(\d+)\./)?.[1] ?? String(units.length + 1);
      const rest = s.replace(/^\d+\.\s+/, "");
      const tm = rest.match(/^\*\*([^*]+)\*\*(.*)$/);
      if (tm) units.push({ n, title: (tm[1]!.trim() + " " + (tm[2] ?? "").trim()).replace(/\s+/g, " ").trim() });
    }
  }
  const bonus: string[] = [];
  const bonusPart = t.split(/###\s*מה בנוסף/)[1];
  if (bonusPart) {
    for (const line of bonusPart.split("\n")) {
      const s = line.trim();
      if (!s.startsWith("-") && !s.startsWith("✅")) continue;
      bonus.push(
        s
          .replace(/^[-*]\s*/, "")
          .replace(/✅/g, "")
          .replace(/\*\*/g, "")
          .trim(),
      );
    }
  }
  return { units, bonusTitle: "מה בנוסף", bonusItems: bonus.filter(Boolean) };
}

export function parseSuccessRules(successBody: string): SuccessPremiumData {
  const t = successBody.replace(/\r\n/g, "\n");
  const block = t.match(/###\s*5 כללי זהב:?\s*([\s\S]*)/i)?.[1] ?? t;
  const rules: GoldenRule[] = [];
  for (const line of block.split("\n")) {
    const s = line.trim();
    if (!/^\d+\./.test(s)) continue;
    const n = Number(s.match(/^(\d+)/)?.[1] ?? rules.length + 1);
    const text = s.replace(/^\d+\.\s+/, "").trim();
    if (text) rules.push({ n, text });
  }
  return { rules };
}

function betweenHeaders(s: string, start: string, end: string): string {
  const a = s.indexOf(start);
  if (a < 0) return "";
  const b = s.indexOf(end, a + start.length);
  if (b < 0) return s.slice(a + start.length).trim();
  return s.slice(a + start.length, b).trim();
}

export function parseExamPremium(examReform: string): ExamPremiumData {
  const t = examReform.replace(/\r\n/g, "\n");
  const preReform = t.split(/##\s*🆕/)[0] ?? t;
  const lede = preReform.split(/###\s*שם המבחן/)[0]!.replace(/^#+\s*[^\n]*\n*/m, "").trim();
  const nameText = betweenHeaders(preReform, "### שם המבחן", "### מבנה").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const structRaw = betweenHeaders(preReform, "### מבנה המבחן", "### סוגי");
  const structureBullets: string[] = [];
  let durationLine = "סה״כ משך: כ-50-60 דקות (כפי שבמקור)";
  for (const line of structRaw.split("\n")) {
    const s = line.trim();
    if (s.startsWith("-") && /סה"כ|סה״כ|משך/.test(s)) {
      durationLine = s.replace(/^-+\s*/, "").trim();
      continue;
    }
    if (s.startsWith("-")) structureBullets.push(s.replace(/^-+\s*/, "").trim());
  }
  const qBlock = betweenHeaders(preReform, "### סוגי השאלות", "### ציון");
  const qRows: ExamQuestionTypeRow[] = [];
  for (const line of qBlock.split("\n")) {
    if (!/^\|/.test(line) || /^\|[-\s|]+\|?$/.test(line)) continue;
    const c = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (c.length < 2 || c[0] === "#" || c[0] === "מספר" || /^סוג$/i.test(c[0]!)) continue;
    qRows.push({ n: c[0]!, type: c[1] ?? "", count: c[2] ?? "", time: c[3] ?? "" });
  }
  const scoreB = betweenHeaders(preReform, "### ציון", "### מבחן אדפטיבי");
  const scoreBullets: string[] = scoreB
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-") && l.length < 200)
    .map((l) => l.replace(/^-+\s*/, "").trim());
  const adaptB = preReform.split(/###\s*מבחן אדפטיבי/)[1] ?? "";
  const adaptText = (adaptB.split("##").shift() ?? adaptB)
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const reformB = t.split(/##\s*🆕/)[1] ?? "";
  let reform: ExamPremiumData["reform"] | undefined;
  if (reformB.trim()) {
    const p1r = reformB.split(/###\s*1\./)[1]?.split(/###\s*2\./)[0] ?? betweenHeaders(reformB, "### 1.", "### 2.");
    const p2r = reformB.split(/###\s*2\./)[1]?.split(/בפרק 7/)[0] ?? "";
    const titleL = reformB.split("\n").find((l) => l.includes("🆕") || l.includes("2026") || l.includes("רפורמה")) ?? "## הרפורמה החדשה (19.4.2026)";
    reform = {
      title: titleL.replace(/^##\s*/, "").replace(/🆕\s*/, "").trim(),
      p1Label: "1. נגישות קולית גורפת",
      p1Text: p1r
        .replace(/^\*?\*?1\.\*?\*?/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.match(/^###\s*1/))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      p2Label: "2. מטלת כתיבה ניסיונית",
      p2Text: p2r
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("###"))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      p3: "בפרק 7 של הקורס נתכונן גם לכך.",
    };
  }
  return {
    lede: lede || t.slice(0, 300).trim(),
    nameLabel: "שם המבחן",
    nameText: nameText || "אמירנ״ט",
    structureTitle: "מבנה המבחן (2026)",
    structureBullets: structureBullets.length ? structureBullets : ["6 סגמנטים מנוקדים – 23 שאלות | 39 דקות", "1-2 סגמנטי ניסוי (לא מנוקדים) – עד 12 דקות"],
    durationLine,
    questionTableTitle: "סוגי השאלות",
    questionRows: qRows.filter((r) => r.type),
    scoreTitle: "ציון",
    scoreBullets: scoreBullets.length ? scoreBullets : ["סקאלה: 50-150"],
    adaptiveTitle: "מבחן אדפטיבי",
    adaptiveText: adaptText,
    reform,
  };
}

export function parseClosingPremium(closingBody: string): ClosingPremiumData {
  const t = stripFences(closingBody.replace(/\r\n/g, "\n"));
  const nextItems: string[] = [];
  const numRe = /^\d+\.\s+(.+)$/gm;
  let nm: RegExpExecArray | null;
  while ((nm = numRe.exec(t)) !== null) {
    if (nm[1]) nextItems.push(nm[1]!.replace(/\s+/g, " ").trim());
  }
  const giftItems: string[] = [];
  for (const line of t.split("\n")) {
    if (!/30 המילים|צ'קליסט|צ׳קליסט|✅/.test(line)) continue;
    const cleaned = line
      .replace(/^-+\s*/, "")
      .replace(/\[\s*✅\s*\]\s*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\s*\|\s*/g, " · ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned && !/^\|+$/.test(cleaned) && !giftItems.includes(cleaned)) {
      giftItems.push(cleaned);
    }
  }
  const cm = t.match(/בהצלחה[^\n]*/);
  return {
    nextTitle: "הצעד הבא",
    nextItems,
    giftTitle: "מתנת פתיחה",
    giftItems: giftItems.filter((x) => x.length > 0),
    closing: cm?.[0]?.trim() ?? "בהצלחה! אני איתכם לכל אורך הדרך. 🍀",
  };
}
