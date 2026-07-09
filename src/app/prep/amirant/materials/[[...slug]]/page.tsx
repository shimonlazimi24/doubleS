import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Heading, Text } from "@/components/ui";
import { listAmirantPublicHtmlEntries } from "@/lib/prep/amirant-html-public.server";
import { listAmirnetMarkdownFiles, safeReadAmirnetMarkdown } from "@/lib/prep/amirnet-materials.server";
import { PREP_BASE } from "@/lib/prep/constants";

const BASE = `${PREP_BASE}/amirant/materials`;

type Props = { params: { slug?: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const slug = params.slug;
  if (!slug?.length) return { title: "חומרי קורס ומידע - אמירנט" };
  return { title: `${slug.join(" / ")} | אמירנט` };
}

function groupByTopFolder(files: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const f of files) {
    const top = f.includes("/") ? f.slice(0, f.indexOf("/")) : "(שורש)";
    if (!m.has(top)) m.set(top, []);
    m.get(top)!.push(f);
  }
  return m;
}

export default function AmirantMaterialsPage({ params }: Props) {
  const slug = params.slug;

  if (!slug || slug.length === 0) {
    const files = listAmirnetMarkdownFiles();
    const htmlEntries = listAmirantPublicHtmlEntries();
    const grouped = files.length > 0 ? groupByTopFolder(files) : new Map<string, string[]>();

    if (files.length === 0 && htmlEntries.length === 0) {
      return (
        <div className="bg-canvas">
          <Container className="py-10" max="measureWide">
            <Link href={`${PREP_BASE}/amirant`} className="text-sm font-semibold text-primary hover:underline">
              ← חזרה לאמירנט
            </Link>
            <Heading level={1} className="mt-4 text-2xl">
              חומרי קורס ומידע
            </Heading>
            <Text as="p" variant="body" className="mt-4 text-muted">
              לא נמצאו קבצים: ודאו שקיימים <code className="rounded bg-surface-low px-1 text-sm">content/amirnet-course</code> ו־
              <code className="rounded bg-surface-low px-1 text-sm">public/amirant-html</code>.
            </Text>
          </Container>
        </div>
      );
    }

    return (
      <div className="bg-canvas">
        <Container className="py-10" max="measureWide">
          <Link href={`${PREP_BASE}/amirant`} className="text-sm font-semibold text-primary hover:underline">
            ← חזרה לאמירנט
          </Link>
          <Heading level={1} className="mt-4 text-2xl md:text-3xl">
            חומרי קורס ומידע
          </Heading>
          <Text as="p" variant="body" className="mt-3 max-w-readable text-muted">
            <strong>Markdown</strong> - תיקיית <code className="rounded bg-surface-low px-1 text-sm">content/amirnet-course</code> (AMIRNET Course). תצוגה גולמית
            בעמוד זה. <strong>HTML</strong> - דפים מעוצבים תחת <code className="rounded bg-surface-low px-1 text-sm">public/amirant-html</code> (נפתחים כדף מלא).
            קבצי <strong>Word (.docx)</strong> אינם נטענים כאן; יש לייצא PDF/Markdown או להעתיק טקסט לפרויקט.
          </Text>

          {htmlEntries.length > 0 ? (
            <section className="mt-10 rounded-2xl border border-line/80 bg-paper p-6 shadow-card">
              <h2 className="text-lg font-semibold text-ink">דפי מידע (HTML)</h2>
              <p className="mt-2 text-sm text-muted">
                עותק מעודכן מקבצי <code className="rounded bg-surface-low px-1">page1…page5 (1).html</code> ומתיקיית «דפי תוכן».
              </p>
              <ul className="mt-4 space-y-2 border-r-2 border-emerald-600/35 pr-4">
                {htmlEntries.map((e) => (
                  <li key={e.url}>
                    <a href={e.url} className="text-sm font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {e.label}
                      <span className="ms-1 text-xs font-normal text-muted">(בכרטיסייה חדשה)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {files.length > 0 ? (
            <div className="mt-10 space-y-10">
              <h2 className="text-lg font-semibold text-ink">קורס AMIRNET (Markdown)</h2>
              {Array.from(grouped.entries()).map(([folder, paths]) => (
                <section key={folder}>
                  <h3 className="text-base font-semibold text-ink/90">{folder}</h3>
                  <ul className="mt-3 space-y-1.5 border-r-2 border-primary/30 pr-4">
                    {paths.map((rel: string) => (
                      <li key={rel}>
                        <Link
                          href={`${BASE}/${rel.split("/").map(encodeURIComponent).join("/")}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {rel}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </Container>
      </div>
    );
  }

  const result = safeReadAmirnetMarkdown(slug);
  if (!result.ok) notFound();

  const maxChars = 120_000;
  const truncated = result.body.length > maxChars;
  const body = truncated ? `${result.body.slice(0, maxChars)}\n\n… [קוצר להצגה: ${result.body.length.toLocaleString("he-IL")} תווים בסך הכל]` : result.body;

  return (
    <div className="bg-canvas">
      <Container className="py-10" max="measureWide">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={BASE} className="text-sm font-semibold text-primary hover:underline">
            ← רשימת כל הקבצים
          </Link>
          <span className="text-line">|</span>
          <Link href={`${PREP_BASE}/amirant/learn`} className="text-sm font-semibold text-primary hover:underline">
            חזרה לקורס באפליקציה
          </Link>
        </div>
        <Heading level={1} className="mt-6 break-all text-xl md:text-2xl">
          {result.rel}
        </Heading>
        {truncated ? (
          <Text as="p" variant="bodySm" className="mt-2 text-amber-900">
            הקובץ ארוך מאוד - מוצגים רק {maxChars.toLocaleString("he-IL")} התווים הראשונים.
          </Text>
        ) : null}
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-surface border border-line/80 bg-paper p-4 text-sm leading-relaxed text-ink shadow-inner">
          {body}
        </pre>
      </Container>
    </div>
  );
}
