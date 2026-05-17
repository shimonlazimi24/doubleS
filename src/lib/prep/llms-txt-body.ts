import { PREP_BASE, PREP_PROTECTED_PREFIXES, PREP_PUBLIC_PATHS } from "@/lib/prep/constants";

/** Plain-text body for `/llms.txt`, derived from route constants to avoid drift. */
export function buildLlmsTxtBody(baseUrl: string): string {
  const lines: string[] = [
    `# prePare — הכנה למבחני אנגלית`,
    `User-agent: *`,
    `Allow: ${PREP_BASE}/`,
    ``,
  ];

  const urls = Array.from(PREP_PUBLIC_PATHS).sort().map((path) => `${baseUrl}${path}`);
  lines.push(...urls, ``);

  for (const prefix of PREP_PROTECTED_PREFIXES) {
    lines.push(`Disallow: ${prefix}`);
    lines.push(`Disallow: ${prefix}/`);
  }

  return `${lines.join("\n")}\n`;
}
