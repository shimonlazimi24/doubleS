import fs from "node:fs";
import path from "node:path";

/** תוכן Markdown שהועתק מ־`Downloads/AMIRNET Course` לתוך הריפו. */
export function getAmirnetContentRoot(): string {
  return path.join(process.cwd(), "content", "amirnet-course");
}

function resolvedUnderRoot(absFile: string): boolean {
  const root = path.resolve(getAmirnetContentRoot());
  const resolved = path.resolve(absFile);
  return resolved === root || resolved.startsWith(root + path.sep);
}

function safeReadAmirnetMarkdown(
  slug: string[],
): { ok: true; body: string; rel: string } | { ok: false; reason: "not_found" | "bad_path" } {
  const joined = slug.join("/");
  if (!joined.endsWith(".md")) return { ok: false, reason: "bad_path" };
  if (joined.includes("..")) return { ok: false, reason: "bad_path" };
  const abs = path.normalize(path.join(getAmirnetContentRoot(), ...slug));
  if (!resolvedUnderRoot(abs)) return { ok: false, reason: "bad_path" };
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return { ok: false, reason: "not_found" };
  const body = fs.readFileSync(abs, "utf8");
  return { ok: true, body, rel: joined.replace(/\\/g, "/") };
}

const DOCS_AMIRNET_PREP = path.join(process.cwd(), "docs", "amirnet-prep");

function resolvedUnderDocsPrepRoot(absFile: string): boolean {
  const root = path.resolve(DOCS_AMIRNET_PREP);
  const resolved = path.resolve(absFile);
  return resolved === root || resolved.startsWith(root + path.sep);
}

/**
 * שיעור קורס: קודם `content/amirnet-course/{rel}`. אם אין - נסיון `docs/amirnet-prep/{אותו שם קובץ}` (שימושי כשמעדכנים רק ב־docs).
 */
export function readAmirantCourseMarkdownSource(
  rel: string,
):
  | { ok: true; body: string; rel: string; fromContentFolder: true }
  | { ok: true; body: string; rel: string; fromContentFolder: false }
  | { ok: false; reason: "not_found" | "bad_path" } {
  if (rel.includes("..") || !rel.endsWith(".md")) return { ok: false, reason: "bad_path" };
  const slug = rel.split("/").filter((s) => s.length > 0);
  const fromContent = safeReadAmirnetMarkdown(slug);
  if (fromContent.ok) return { ok: true, body: fromContent.body, rel: fromContent.rel, fromContentFolder: true };

  const base = slug[slug.length - 1];
  if (!base) return { ok: false, reason: "not_found" };
  const abs = path.normalize(path.join(DOCS_AMIRNET_PREP, base));
  if (!resolvedUnderDocsPrepRoot(abs) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return { ok: false, reason: "not_found" };
  }
  const body = fs.readFileSync(abs, "utf8");
  return {
    ok: true,
    body,
    rel: `docs/amirnet-prep/${base}`,
    fromContentFolder: false,
  };
}
