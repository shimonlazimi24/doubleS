import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { blogReadingMinutes } from "@/lib/prep/blog-meta";
import { formatHeDate } from "@/lib/prep/format-he-date";
import { Reveal } from "./motion/Reveal";
import { MarketingSection } from "./MarketingSection";

export type GuideListItem = { slug: string; title: string; description: string; date: string; updated?: string; body: string };

/**
 * The newest guides on the home page, as the same typographic list the hub
 * uses: hairlines between items, meta line, title, one-line description.
 */
export function GuidesSection({ guides }: { guides: readonly GuideListItem[] }) {
  if (!guides.length) return null;
  return (
    <MarketingSection
      id="guides"
      title="מדריכים"
      subtitle="מה שמחפשים לפני המבחן, כתוב מחומר הקורס ועם המספרים האמיתיים. כל מדריך מסתיים בשאלה פתורה."
      tone="paper"
    >
      <Reveal delay={120}>
        <ul className="border-t border-line" role="list">
          {guides.map((g) => (
            <li key={g.slug} className="border-b border-line">
              <Link href={`${PREP_BASE}/blog/${g.slug}`} className="group block py-6 md:grid md:grid-cols-[11rem_1fr] md:gap-8">
                <p className="text-sm tabular-nums text-muted-2">
                  {formatHeDate(g.updated ?? g.date)}
                  <span aria-hidden> · </span>
                  {blogReadingMinutes(g.body)} דק׳
                </p>
                <div className="mt-1.5 md:mt-0">
                  <h3 className="text-[1.3rem] font-bold leading-snug text-ink transition group-hover:text-primary">{g.title}</h3>
                  <p className="mt-1.5 max-w-[40rem] text-[16px] leading-relaxed text-muted">{g.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[16px]">
          <Link href={`${PREP_BASE}/blog`} className="font-semibold text-primary hover:underline">
            כל המדריכים
          </Link>
          <span className="text-muted"> · </span>
          <Link href={`${PREP_BASE}/amirant/sample-questions`} className="font-semibold text-primary hover:underline">
            שאלות לדוגמה עם תשובות
          </Link>
        </p>
      </Reveal>
    </MarketingSection>
  );
}
