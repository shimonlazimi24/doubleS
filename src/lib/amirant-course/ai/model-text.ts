/**
 * The model sometimes writes the two characters backslash-n inside its answer instead
 * of a line break (seen in production: "טיפ: \n- יש לך..."). Inside the JSON they are an
 * escaped backslash, so the decoder correctly leaves them - here they become real breaks.
 * Done on the server so the insight log, the stream and the final answer all agree.
 */
export function normalizeModelLineBreaks(text: string): string {
  return text.replace(/\\n/g, "\n").replace(/\\t/g, " ");
}

/**
 * Same normalisation for a token stream: a delta may end in the backslash of a split
 * pair, so the trailing backslash waits for the next delta. `flush()` releases it.
 */
export function createLineBreakNormalizer(): { push(delta: string): string; flush(): string } {
  let carry = "";
  return {
    push(delta: string): string {
      let s = carry + delta;
      carry = "";
      if (s.endsWith("\\")) {
        carry = "\\";
        s = s.slice(0, -1);
      }
      return normalizeModelLineBreaks(s);
    },
    flush(): string {
      const s = carry;
      carry = "";
      return s;
    },
  };
}
