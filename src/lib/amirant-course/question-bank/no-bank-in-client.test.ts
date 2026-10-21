import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * No client module may reach the question bank.
 *
 * Until 2026-10-22 `client-bank.ts` imported `questions.public.json` and was
 * statically imported by every quiz and lesson component, so each page chunk
 * carried the whole bank — 748 questions, the owner's paid sets and the
 * simulations included — to every visitor, 495KB of it. `check-client-chunks`
 * catches answer keys in the build; it cannot tell a question stem from any
 * other string. This walks the import graph instead: from every `"use client"`
 * file under src/components and src/app, through every `@/` and relative
 * import, nothing may lead to a bank module or a bank data file.
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /question-bank\/client-bank\.(ts|tsx)$/, why: "the browser bank (removed; do not bring it back)" },
  { pattern: /questions\.public\.json$/, why: "the public question file (every stem, paid sets included)" },
  { pattern: /source\/questions\.json$/, why: "the full bank with answer keys" },
  { pattern: /source\/passages\.json$/, why: "every reading passage" },
  { pattern: /question-bank\/index\.(ts|tsx)$/, why: "the server bank (answer keys)" },
  { pattern: /question-bank\/for-client\.server\.(ts|tsx)$/, why: "the server-side serializer (imports the full bank)" },
];

const SOURCE_EXT = [".ts", ".tsx"];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(full);
    return SOURCE_EXT.includes(path.extname(e.name)) && !/\.test\.tsx?$/.test(e.name) ? [full] : [];
  });
}

function isClientModule(file: string): boolean {
  const head = fs.readFileSync(file, "utf8").slice(0, 600);
  return /^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(head);
}

/** Runtime import specifiers only: `import type` / `export type` are erased by the compiler. */
function importSpecifiers(source: string): string[] {
  const out: string[] = [];
  const re = /(?:^|\n)\s*(?:import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m[1]) continue;
    out.push(m[2]!);
  }
  return out;
}

function resolve(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package
  const candidates = [base, ...SOURCE_EXT.map((e) => base + e), ...SOURCE_EXT.map((e) => path.join(base, "index" + e))];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Depth-first from `entry`; returns the first forbidden path and the chain that led there. */
function findForbidden(entry: string, seen: Map<string, string[]>): { file: string; chain: string[]; why: string } | null {
  const stack: { file: string; chain: string[] }[] = [{ file: entry, chain: [entry] }];
  while (stack.length) {
    const { file, chain } = stack.pop()!;
    if (seen.has(file)) continue;
    seen.set(file, chain);
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(file)) return { file, chain, why: rule.why };
    }
    if (!SOURCE_EXT.includes(path.extname(file))) continue;
    for (const spec of importSpecifiers(fs.readFileSync(file, "utf8"))) {
      const target = resolve(file, spec);
      if (target && !seen.has(target)) stack.push({ file: target, chain: [...chain, target] });
    }
  }
  return null;
}

describe("client modules never import the question bank", () => {
  const entries = [path.join(SRC, "components"), path.join(SRC, "app")].flatMap(walk).filter(isClientModule);

  it("finds the client modules to check", () => {
    expect(entries.length).toBeGreaterThan(20);
  });

  it("reaches no bank module or bank data file from any of them", () => {
    const problems: string[] = [];
    for (const entry of entries) {
      const hit = findForbidden(entry, new Map());
      if (hit) {
        problems.push(
          `${path.relative(ROOT, entry)} reaches ${hit.why}:\n    ${hit.chain.map((f) => path.relative(ROOT, f)).join("\n    -> ")}`,
        );
      }
    }
    expect(problems, problems.join("\n\n")).toEqual([]);
  });
});
