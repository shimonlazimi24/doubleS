import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { checkServiceRoleKey } from "@/lib/prep/supabase/service-role-check";
import { AMIRANT_BANK_MODE, AMIRANT_BANK_QUESTIONS } from "@/lib/amirant-course/question-bank";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";

export const dynamic = "force-dynamic";

type Stats = {
  cmsLessons: number;
  cmsPublished: number;
  learners: number | null;
  paid: number | null;
};

async function getStats(): Promise<Stats> {
  const supabase = createPrepSupabaseServerClient();
  const service = getPrepSupabaseServiceClient();

  const cms = supabase
    ? await Promise.all([
        supabase.from("cms_lessons").select("*", { count: "exact", head: true }),
        supabase.from("cms_lessons").select("*", { count: "exact", head: true }).eq("published", true),
      ])
    : null;

  let learners: number | null = null;
  let paid: number | null = null;
  if (service) {
    const [onboarding, entitlements] = await Promise.all([
      service.from("prep_learner_onboarding").select("*", { count: "exact", head: true }),
      service
        .from("course_entitlements")
        .select("*", { count: "exact", head: true })
        .in("access_type", ["paid", "admin"]),
    ]);
    learners = onboarding.count ?? null;
    paid = entitlements.count ?? null;
  }

  return {
    cmsLessons: cms?.[0]?.count ?? 0,
    cmsPublished: cms?.[1]?.count ?? 0,
    learners,
    paid,
  };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const keyStatus = checkServiceRoleKey();
  const manifestLessons = AMIRANT_PREPARATION_MANIFEST.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );

  return (
    <div dir="rtl" className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="סקירה"
        subtitle="מצב התוכן והנרשמים. עריכת שיעורים דורסת את הטקסט שמגיע מקבצי הקורס."
      />

      {!keyStatus.ok ? (
        <AdminNotice tone="error">
          <p className="font-semibold">מפתח ה-service של Supabase אינו תקין.</p>
          <p className="mt-1">
            נתוני הנרשמים לא ייטענו, ורכישות ייכשלו. יש להחליף את המפתח בערך של{" "}
            <span className="font-semibold">service_role</span> מ-Supabase (Project Settings → API
            Keys) ולפרוס מחדש.
          </p>
          <p dir="ltr" className="mt-2 rounded bg-surface-low px-2 py-1 font-mono text-xs">
            SUPABASE_SERVICE_ROLE_KEY — {keyStatus.detail}
          </p>
        </AdminNotice>
      ) : null}

      <div className="grid divide-y divide-line rounded-surface border border-line bg-paper sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-x-reverse">
        <Stat label="שיעורים בקורס" value={String(manifestLessons)} hint="מקבצי התוכן" />
        <Stat
          label="נערכו באדמין"
          value={String(stats.cmsLessons)}
          hint={`${stats.cmsPublished} פורסמו`}
        />
        <Stat
          label="מילאו שאלון"
          value={stats.learners === null ? "—" : String(stats.learners)}
          hint={stats.learners === null ? "דורש מפתח service" : undefined}
        />
        <Stat
          label="עם גישה בתשלום"
          value={stats.paid === null ? "—" : String(stats.paid)}
          hint={stats.paid === null ? "דורש מפתח service" : undefined}
        />
      </div>

      <AdminNotice tone="info">
        בנק השאלות הפעיל:{" "}
        <strong className="font-semibold">
          {AMIRANT_BANK_MODE === "production"
            ? `מיובא · ${AMIRANT_BANK_QUESTIONS.length} שאלות`
            : "דמו סינתטי"}
        </strong>
        . החידונים והסימולציות רצים עליו — לא על שאלות שנערכות כאן.
      </AdminNotice>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">מה אפשר לעשות</h2>
        <div className="divide-y divide-line rounded-surface border border-line bg-paper">
          {[
            {
              href: "/prep/admin/lessons",
              title: "עריכת שיעורים",
              body: "לחפש שיעור, לערוך את הטקסט שלו ולפרסם. עד שמפרסמים — התלמידים רואים את הגרסה מקבצי הקורס.",
            },
            {
              href: "/prep/admin/lessons/new",
              title: "הוספת שיעור חדש",
              body: "שיעור שלא קיים בקבצי הקורס. צריך מזהה ומודול.",
            },
            {
              href: "/prep/admin/learners",
              title: "נרשמים ותשובות השאלון",
              body: "מי נרשם, לאיזה מוסד, מתי המבחן שלו, ומי שילם. אפשר לייצא ל-CSV.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 transition hover:bg-surface-low"
            >
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
