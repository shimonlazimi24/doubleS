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
