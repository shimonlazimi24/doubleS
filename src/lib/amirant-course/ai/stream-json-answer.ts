/**
 * Pulls the visible `answer` string out of a structured-output JSON stream while the
 * model is still generating the rest of the object.
 *
 * Why a stateful extractor: deltas can split a JSON escape (`\` in one chunk, `n` in the
 * next) or a `\uXXXX` sequence. The extractor keeps any incomplete escape pending and
 * emits only fully decoded characters, so the learner never sees a stray backslash.
 */
const ANSWER_KEY = /"answer"\s*:\s*"/;

export type AnswerStreamExtractor = {
  /** Feed one raw delta; returns the decoded answer characters that became visible. */
  push(delta: string): string;
  /** True once the closing quote of `answer` was seen. */
  readonly done: boolean;
};

export function createAnswerStreamExtractor(): AnswerStreamExtractor {
  let head = ""; // raw text seen before the answer value starts
  let started = false;
  let done = false;
  let pending = ""; // raw, not yet decoded (may end mid-escape)

  const decode = (raw: string): { text: string; rest: string; closed: boolean } => {
    let text = "";
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i]!;
      if (ch === '"') {
        return { text, rest: "", closed: true };
      }
      if (ch !== "\\") {
        text += ch;
        i += 1;
        continue;
      }
      // Escape sequence: need at least one more char; \u needs four hex digits.
      const next = raw[i + 1];
      if (next === undefined) return { text, rest: raw.slice(i), closed: false };
      if (next === "u") {
        const hex = raw.slice(i + 2, i + 6);
        if (hex.length < 4) return { text, rest: raw.slice(i), closed: false };
        const code = Number.parseInt(hex, 16);
        text += Number.isNaN(code) ? "" : String.fromCharCode(code);
        i += 6;
        continue;
      }
      const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\", "/": "/" };
      text += map[next] ?? next;
      i += 2;
    }
    return { text, rest: "", closed: false };
  };

  return {
    get done() {
      return done;
    },
    push(delta: string): string {
      if (done || !delta) return "";
      if (!started) {
        head += delta;
        const m = ANSWER_KEY.exec(head);
        if (!m) return "";
        started = true;
        pending = head.slice(m.index + m[0].length);
        head = "";
      } else {
        pending += delta;
      }
      const { text, rest, closed } = decode(pending);
      pending = rest;
      if (closed) done = true;
      return text;
    },
  };
}
