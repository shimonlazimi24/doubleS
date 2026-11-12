/**
 * Notifies IndexNow (Bing, Yandex, Seznam, Naver; Bing feeds ChatGPT and
 * Copilot search) about every URL in the live sitemap, so new or changed
 * pages are crawled without waiting for discovery.
 *
 * The key is public by design: IndexNow verifies ownership by fetching
 * https://<host>/<key>.txt, which lives in public/. Run after a deploy that
 * adds or changes public pages:
 *
 *   node scripts/seo/indexnow-submit.mjs            # all sitemap URLs
 *   node scripts/seo/indexnow-submit.mjs /prep/blog/new-guide   # specific paths
 */
import fs from "node:fs";
import path from "node:path";

const HOST = "getprepared.academy";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function findKey() {
  const dir = path.join(process.cwd(), "public");
  const file = fs.readdirSync(dir).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) throw new Error("No IndexNow key file (32 hex chars + .txt) in public/");
  return file.replace(/\.txt$/, "");
}

async function sitemapUrls() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim());
}

async function main() {
  const key = findKey();
  const keyLocation = `${ORIGIN}/${key}.txt`;
  const live = await fetch(keyLocation);
  if (!live.ok || (await live.text()).trim() !== key) {
    throw new Error(`Key file is not live at ${keyLocation}; deploy first.`);
  }

  const args = process.argv.slice(2);
  const urlList = args.length ? args.map((p) => (p.startsWith("http") ? p : `${ORIGIN}${p}`)) : await sitemapUrls();
  if (urlList.length === 0) throw new Error("No URLs to submit.");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
  });
  // 200 = accepted, 202 = accepted and key validation pending.
  console.log(`IndexNow: ${res.status} for ${urlList.length} URLs`);
  if (res.status >= 400) {
    console.error(await res.text());
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
