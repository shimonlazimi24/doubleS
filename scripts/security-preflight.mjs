import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const envFiles = [".env", ".env.local", ".env.production", ".env.development"];
const dangerousPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9_\-.]+/i,
  /OPENAI_API_KEY\s*=\s*sk-[A-Za-z0-9_\-]+/i,
  /SENTRY_AUTH_TOKEN\s*=\s*[A-Za-z0-9_\-.]+/i,
];

let found = [];
for (const rel of envFiles) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) continue;
  const text = fs.readFileSync(filePath, "utf8");
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      found.push({ file: rel, pattern: String(pattern) });
    }
  }
}

if (found.length > 0) {
  console.error("Security preflight failed: secret-like values detected in local env files.");
  console.error(JSON.stringify(found, null, 2));
  process.exit(2);
}

console.log("Security preflight passed.");
