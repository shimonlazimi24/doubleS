import fs from "node:fs";
import path from "node:path";

const PUBLIC_HTML_ROOT = path.join(process.cwd(), "public", "amirant-html");

export type AmirantStaticHtmlEntry = { url: string; label: string };

/** קבצי HTML סטטיים תחת `public/amirant-html` (דפי מידע מעוצבים). */
export function listAmirantPublicHtmlEntries(): AmirantStaticHtmlEntry[] {
  if (!fs.existsSync(PUBLIC_HTML_ROOT)) return [];
  const out: AmirantStaticHtmlEntry[] = [];
  const walk = (dir: string, relFromRoot: string) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith(".")) continue;
      const rel = relFromRoot ? `${relFromRoot}/${ent.name}` : ent.name;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full, rel);
      else if (ent.name.endsWith(".html")) {
        const urlPath = rel.split(path.sep).join("/");
        out.push({ url: `/amirant-html/${urlPath}`, label: urlPath });
      }
    }
  };
  walk(PUBLIC_HTML_ROOT, "");
  return out.sort((a, b) => a.label.localeCompare(b.label, "he"));
}
