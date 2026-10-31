import type { Metadata } from "next";
import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkServiceRoleKey } from "@/lib/prep/supabase/service-role-check";
import { AMIRANT_BANK_MODE, AMIRANT_BANK_QUESTIONS } from "@/lib/amirant-course/question-bank";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { learnerTotals } from "@/lib/prep/admin/learner-rows";
import { loadAdminLearners } from "@/lib/prep/admin/learners.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "סקירה | PREPARE admin" };

async function getCmsCounts(): Promise<{ edited: number; published: number } | null> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const [all, published] = await Promise.all([
    supabase.from("cms_lessons").select("id", { count: "exact", head: true }),
    supabase.from("cms_lessons").select("id", { count: "exact", head: true }).eq("published", true),
  ]);
  if (all.error || published.error) return null;
  return { edited: all.count ?? 0, published: published.count ?? 0 };
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[9rem] flex-1 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{value}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

const LINKS = [
  {
    href: "/prep/admin/learners",
    title: "נרשמים",
    body: "כל החשבונות, מי מילא שאלון, מתי המבחן ומי עם גישה בתשלום. ייצוא ל-CSV.",
  },
  {
    href: "/prep/admin/payments",
    title: "תשלומים",
    body: "כל ניסיון רכישה מול Hyp, ומה השתבש כשלא הושלם.",
  },
  {
    href: "/prep/admin/lessons",
    title: "שיעורים",
    body: "עריכת הטקסט או הסרטון של שיעור קיים. עד הפרסום התלמידים רואים את הגרסה מקבצי הקורס.",
  },
  {
    href: "/prep/admin/settings",
    title: "סרטונים",
    body: "סרטוני הפתיחה בעמוד הבית ובעמוד הקורס.",
  },
];

export default async function AdminDashboard() {
  const keyStatus = checkServiceRoleKey();
  const [cms, learners] = await Promise.all([getCmsCounts(), loadAdminLearners()]);
  const totals = learners.error ? null : learnerTotals(learners.rows);
  const manifestLessons = AMIRANT_PREPARATION_MANIFEST.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const dash = "—";

  return (
    <div dir="rtl" className="max-w-4xl space-y-8">
      <AdminPageHeader title="סקירה" subtitle="מצב הנרשמים והתוכן, נכון לרגע הטעינה." />

      {!keyStatus.ok ? (
        <AdminNotice tone="error">
          <p className="font-semibold">מפתח ה-service של Supabase אינו תקין.</p>
          <p className="mt-1">
            נתוני הנרשמים לא ייטענו, ורכישות ייכשלו. יש להחליף את המפתח בערך של service_role מ-Supabase
            (Project Settings, API Keys) ולפרוס מחדש.
          </p>
          <p dir="ltr" className="mt-2 font-mono text-xs">
            {keyStatus.detail}
          </p>
        </AdminNotice>
      ) : null}

      <dl className="flex flex-wrap gap-x-8 border-y border-line">
        <Figure label="חשבונות" value={totals ? String(totals.signedUp) : dash} />
        <Figure
          label="מילאו שאלון"
          value={totals ? String(totals.onboarded) : dash}
          hint={
            totals && totals.signedUp > 0
              ? `${Math.round((totals.onboarded / totals.signedUp) * 100)}% מהחשבונות`
              : undefined
          }
        />
        <Figure label="גישה בתשלום בתוקף" value={totals ? String(totals.paidActive) : dash} />
        <Figure
          label="שיעורים שנערכו"
          value={cms ? String(cms.edited) : dash}
          hint={cms ? `${cms.published} פורסמו · מתוך ${manifestLessons}` : `מתוך ${manifestLessons}`}
        />
      </dl>

      <p className="text-sm text-muted">
        בנק השאלות הפעיל:{" "}
        <span className="font-semibold text-ink">
          {AMIRANT_BANK_MODE === "production"
            ? `מיובא, ${AMIRANT_BANK_QUESTIONS.length} שאלות`
            : "דמו סינתטי"}
        </span>
        . החידונים והסימולציות רצים עליו, לא על שאלות שנערכות באדמין.
      </p>

      <ul className="divide-y divide-line border-y border-line">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block py-3 transition hover:bg-surface-low sm:px-2">
              <span className="block text-sm font-semibold text-ink">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{item.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
