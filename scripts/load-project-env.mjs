import fs from "node:fs";
import path from "node:path";

/**
 * Load `.env` then `.env.local` from the repo root (Next.js order: later file wins).
 * Does not override variables already set in the process environment (e.g. CI).
 */
export function loadProjectEnv(cwd = process.cwd()) {
  const merged = new Map();
  for (const name of [".env", ".env.local"]) {
    const filePath = path.join(cwd, name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const [k, v] of parseEnvLines(text)) {
      merged.set(k, v);
    }
  }
  for (const [k, v] of merged) {
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

function parseEnvLines(text) {
  const out = [];
  for (let line of text.split("\n")) {
    line = line.replace(/\r$/, "");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    out.push([key, val]);
  }
  return out;
}
