import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  keywords: string[];
  body: string;
};

const BLOG_ROOT = path.join(process.cwd(), "content", "blog");

/** frontmatter מינימלי (`--- key: "value" ---`) - בלי תלות חדשה. */
function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string | string[]> = {};
  for (const line of m[1]!.split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1]!;
    const val = kv[2]!.trim();
    if (val.startsWith("[")) {
      try {
        meta[key] = JSON.parse(val) as string[];
      } catch {
        meta[key] = val;
      }
    } else {
      meta[key] = val.replace(/^"|"$/g, "");
    }
  }
  return { meta, body: raw.slice(m[0].length) };
}

function readPost(slug: string): BlogPost | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const abs = path.join(BLOG_ROOT, `${slug}.md`);
  if (!fs.existsSync(abs)) return null;
  const { meta, body } = parseFrontmatter(fs.readFileSync(abs, "utf8"));
  const title = typeof meta.title === "string" ? meta.title : slug;
  const description = typeof meta.description === "string" ? meta.description : "";
  const date = typeof meta.date === "string" ? meta.date : "";
  const keywords = Array.isArray(meta.keywords) ? meta.keywords : [];
  if (!title || !body.trim()) return null;
  return { slug, title, description, date, keywords, body: body.trim() };
}

export function listBlogPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_ROOT)) return [];
  return fs
    .readdirSync(BLOG_ROOT)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPost(f.replace(/\.md$/, "")))
    .filter((p): p is BlogPost => Boolean(p))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(slug: string): BlogPost | null {
  return readPost(slug);
}
