import Link from "next/link";
import { Card, CardBody } from "@/components/ui";

type LandingProps = {
  title: string;
  description: string;
  demoQuizHref: string;
  firstSimulationHref: string | null;
  dashboardHref: string;
  isFree?: boolean;
};

const DIFFERENTIATORS = [
  { icon: "◈", title: "למידה אדפטיבית", body: "רמת קושי משתנה בזמן אמת לפי ביצועים, לא לפי מסלול גנרי." },
  { icon: "✦", title: "AI Coach", body: "משוב קצר אחרי כל בוחן: מה מחזק ציון מיידית ומה לדחות." },
  { icon: "◎", title: "זיהוי חולשות", body: "בוחנים מותאמים לנקודות החלשות שלך במקום תרגול מיותר." },
  { icon: "▣", title: "סימולציות אמיתיות", body: "תרחיש מבחן מלא עם לחץ זמן וניהול קצב כמו ביום הבחינה." },
] as const;

const HOW_IT_WORKS = [
  { title: "אבחון פתיחה", body: "מבחן לדוגמה שממפה רמה, מהירות ונושאים חלשים." },
  { title: "תוכנית אישית", body: "מערכת שמגדירה סדר עדיפויות לימודי לפי נתוני אמת." },
  { title: "אימון ממוקד", body: "תרגול אדפטיבי + סימולציות מלאות עד יציבות בביצוע." },
  { title: "שיפור מדיד", body: "דשבורד עם ציון, זמן לשאלה והתקדמות לפטור." },
] as const;

const SCORE_LANES = [
  { range: "134–150", label: "פטור מלא", courses: "0 קורסים", width: "92%", tone: "bg-emerald-700" },
  { range: "120–133", label: "מתקדמים ב׳", courses: "קורס אחד", width: "74%", tone: "bg-sky-700" },
  { range: "100–119", label: "מתקדמים א׳", courses: "2 קורסים", width: "58%", tone: "bg-amber-600" },
  { range: "85–99", label: "בסיסי", courses: "3–4 קורסים", width: "38%", tone: "bg-rose-700" },
] as const;

const TESTIMONIALS = [
  { name: "נועה ל.", role: "מדעי המחשב", avatar: "נ", quote: "מ-82 ל-118 תוך שישה שבועות. הגעתי לפטור בלי לבזבז שנה." },
  { name: "איתי ש.", role: "הנדסה", avatar: "א", quote: "הסימולציות היו הכי קרובות למבחן האמיתי, וזה הוריד לחץ ביום הבחינה." },
  { name: "שיר ר.", role: "מדעי החיים", avatar: "ש", quote: "הבנתי בדיוק מה חלש אצלי, והציון עלה ב-24 נקודות." },
] as const;

const DEMO_PREVIEW = {
  learnerName: "דנה",
  score: 112,
  level: "מתקדמים א׳",
  weakTopics: ["Sentence Completion", "Restatement", "ניהול זמן"],
  summary: "מומלץ להתמקד תחילה בהשלמת משפטים וניסוח מחדש כדי לסגור פער ולנוע מהר לטווח הפטור.",
} as const;

function SectionTitle({
  kicker,
  title,
  subtitle,
  light = false,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="space-y-2">
      {kicker ? (
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${light ? "text-[#f1d286]" : "text-[#b88a2f]"}`}>
          {kicker}
        </p>
      ) : null}
      <h2 className={`font-display text-2xl font-bold leading-tight md:text-3xl ${light ? "text-white" : "text-[#0f1e3d]"}`}>
        {title}
      </h2>
      {subtitle ? (
        <p className={`max-w-2xl text-sm leading-relaxed md:text-base ${light ? "text-white/75" : "text-[#5a6480]"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function AmirantCourseLandingPage({
  title,
  description,
  demoQuizHref,
  firstSimulationHref,
  dashboardHref,
  isFree = false,
}: LandingProps) {
  return (
    <div dir="rtl" className="-mx-4 bg-[#fbf8f1] px-4 py-2 pb-24 md:px-6 md:pb-28">
      <div className="mx-auto max-w-[1100px] space-y-10 md:space-y-14">
        <section className="overflow-hidden rounded-[20px] border border-[#203158] bg-gradient-to-br from-[#0f1e3d] via-[#1a3260] to-[#0f1e3d] p-6 text-white shadow-lift md:p-10">
          <div className="inline-flex items-center rounded-full border border-[#d4a843]/50 bg-[#d4a843]/15 px-4 py-1 text-xs font-semibold tracking-wide text-[#f1d286]">
            מעודכן 2026 · מבוסס נתונים
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl">
            פטור מאנגלית באמירנט
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
            מסלול הכנה סמכותי שמוביל לפטור אמיתי, חוסך קורסי השלמה, ומקצר חודשים מהתואר בעלות נמוכה משמעותית.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            יעד ברור: להגיע לטווח שמוריד עלויות של אלפי שקלים ומונע עיכוב אקדמי.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={demoQuizHref}
              className="inline-flex items-center justify-center rounded-control bg-[#d4a843] px-6 py-3 text-sm font-bold text-[#0f1e3d] shadow-cta transition hover:bg-[#e7bb59]"
            >
              נסה מבחן לדוגמא
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="עלות הדחייה"
            title="למה חשוב לסגור אמירנט מוקדם?"
            subtitle="ציון נמוך לא נגמר ביום הבחינה. הוא גורר קורסים, עלויות ועיכוב בהתקדמות בתואר."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-[#e9d2d2] bg-[#fff4f4]">
              <CardBody className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9b2c2c]">בלי הכנה ממוקדת</p>
                <p className="font-display text-4xl font-bold text-[#9b2c2c]">3–5</p>
                <p className="text-sm text-[#6d4a4a]">קורסי אנגלית · אלפי שקלים · עיכוב של שנה+</p>
              </CardBody>
            </Card>
            <Card className="border-[#cfe9d8] bg-[#f1fff6]">
              <CardBody className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1d6b47]">עם ציון גבוה</p>
                <p className="font-display text-4xl font-bold text-[#1d6b47]">0</p>
                <p className="text-sm text-[#35614b]">קורסי השלמה · חיסכון זמן וכסף · כניסה חלקה לתואר</p>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="מבנה המבחן"
            title="אמירנט בקצרה"
            subtitle="מבחן אדפטיבי ממוחשב. הרמה משתנה לפי ביצועים, ולכן דיוק וקצב חשובים לא פחות מידע."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[#d6deec] bg-white">
              <CardBody className="space-y-2 p-5">
                <p className="text-sm font-bold text-[#0f1e3d]">מה זה אמירנט</p>
                <p className="text-sm text-[#5a6480]">מבחן מיון אנגלית לאקדמיה שקובע שיבוץ רמה ופטור.</p>
              </CardBody>
            </Card>
            <Card className="border-[#d6deec] bg-white">
              <CardBody className="space-y-2 p-5">
                <p className="text-sm font-bold text-[#0f1e3d]">אדפטיביות</p>
                <p className="text-sm text-[#5a6480]">שאלות נהיות קלות או קשות יותר לפי תשובות בזמן אמת.</p>
              </CardBody>
            </Card>
            <Card className="border-[#d6deec] bg-white">
              <CardBody className="space-y-2 p-5">
                <p className="text-sm font-bold text-[#0f1e3d]">זמן ומבנה</p>
                <p className="text-sm text-[#5a6480]">מקטעים קצרים תחת זמן מוגבל, עם דגש על שליטה בקצב.</p>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="מפת ציונים"
            title="איך ציון משפיע על התואר בפועל"
            subtitle="כל מדרגת ציון משנה כמה קורסי אנגלית תלמד וכמה זמן וכסף תשלם."
          />
          <Card className="border-[#d9dfec] bg-white">
            <CardBody className="space-y-4 p-6">
              {SCORE_LANES.map((lane) => (
                <div key={lane.range} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0f1e3d]">
                      {lane.range} · {lane.label}
                    </span>
                    <span className="text-[#5a6480]">{lane.courses}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#e9edf5]">
                    <div className={`h-3 rounded-full ${lane.tone}`} style={{ width: lane.width }} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </section>

        <section className="rounded-[16px] border border-[#d4a843]/35 bg-[#fff9ea] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#0f1e3d] md:text-base">בדוק את הרמה שלך תוך 3 דקות</p>
            <Link
              href={demoQuizHref}
              className="inline-flex items-center justify-center rounded-control bg-[#0f1e3d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#16306a]"
            >
              נסה מבחן חינם
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="יתרון המוצר"
            title="מה הופך את הקורס הזה למסלול מומחה"
            subtitle="שילוב בין מתודולוגיה אקדמית מסודרת לבין חוויית מוצר מדידה ומותאמת אישית."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <Card key={item.title} className="border-[#d7deec] bg-white">
                <CardBody className="space-y-2 p-5">
                  <p className="text-lg leading-none text-[#b88a2f]">{item.icon}</p>
                  <h3 className="font-semibold text-[#0f1e3d]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#5a6480]">{item.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="Preview"
            title="כך נראית תוצאה אישית אחרי הדמו"
            subtitle="בסיום המבחן מתקבלת תמונת מצב מיידית עם ציון, רמה משוערת ונושאים לחיזוק."
          />
          <Card className="border-[#d7deec] bg-white">
            <CardBody className="space-y-4 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e7ebf5] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#b88a2f]">
                    תוצאה לדוגמה · {DEMO_PREVIEW.learnerName}
                  </p>
                  <p className="mt-1 text-sm text-[#5a6480]">מבוסס על ביצועים בזמן אמת</p>
                </div>
                <p className="font-display text-3xl font-bold text-[#0f1e3d]">{DEMO_PREVIEW.score}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-control border border-[#dbe2f0] bg-[#f8faff] p-3">
                  <p className="text-xs text-[#5a6480]">רמה משוערת</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f1e3d]">{DEMO_PREVIEW.level}</p>
                </div>
                <div className="rounded-control border border-[#dbe2f0] bg-[#f8faff] p-3 md:col-span-2">
                  <p className="text-xs text-[#5a6480]">נושאים חלשים</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f1e3d]">{DEMO_PREVIEW.weakTopics.join(" · ")}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#5a6480]">{DEMO_PREVIEW.summary}</p>
            </CardBody>
          </Card>
        </section>

        <section className="rounded-[20px] border border-[#d4a843]/45 bg-gradient-to-b from-[#fff9ea] to-[#fffdf6] p-6 text-center shadow-card md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b88a2f]">Demo</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#0f1e3d] md:text-4xl">מבחן אמיתי — לא דמו</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#5a6480] md:text-base">
            אותו סגנון חשיבה, אותו לחץ זמן, ואותה תחושת מבחן. זה המקום לראות איפה אתה עומד באמת.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={demoQuizHref}
              className="inline-flex items-center justify-center rounded-control bg-[#0f1e3d] px-8 py-3 text-sm font-bold text-white shadow-cta transition hover:bg-[#16306a]"
            >
              התחל מבחן לדוגמא
            </Link>
            {firstSimulationHref ? (
              <Link
                href={firstSimulationHref}
                className="inline-flex items-center justify-center rounded-control border border-[#0f1e3d]/30 bg-white px-6 py-3 text-sm font-semibold text-[#0f1e3d] transition hover:bg-[#f7f9ff]"
              >
                מעבר לסימולציה מלאה
              </Link>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="4 שלבים"
            title="איך זה עובד בפועל"
            subtitle="תהליך ברור, מדיד וקצר שמיועד להוביל לציון שמייצר פטור."
          />
          <div className="grid gap-3 md:grid-cols-2">
            {HOW_IT_WORKS.map((step, idx) => (
              <Card key={step.title} className="border-[#d6deec] bg-white">
                <CardBody className="flex gap-3 p-5">
                  <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#0f1e3d] text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#0f1e3d]">{step.title}</p>
                    <p className="text-sm text-[#5a6480]">{step.body}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            kicker="סטודנטים מספרים"
            title="תוצאות אמיתיות מהשטח"
            subtitle="שיפור בציון, חיסכון בסמסטרים, ופטור מאנגלית בזמן."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <Card key={item.name} className="border-[#d6deec] bg-white">
                <CardBody className="space-y-3 p-5">
                  <p className="text-sm leading-relaxed text-[#2c3550]">&ldquo;{item.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2ff] text-sm font-bold text-[#0f1e3d]">
                      {item.avatar}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0f1e3d]">{item.name}</p>
                      <p className="text-xs text-[#5a6480]">{item.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#e6c8a0] bg-[#fff6ec] p-6 md:p-8">
          <SectionTitle
            kicker="דחיפות"
            title="הרפורמה כבר כאן. קורסים מיושנים לא מספיקים."
            subtitle="מי שממשיך עם חומר לא מעודכן מגיע פחות מוכן לחלקים החדשים ומשלם את זה בציון."
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={demoQuizHref}
              className="inline-flex items-center justify-center rounded-control bg-[#0f1e3d] px-6 py-3 text-sm font-bold text-white shadow-cta transition hover:bg-[#16306a]"
            >
              התחל עכשיו
            </Link>
            <Link
              href={dashboardHref}
              className="inline-flex items-center justify-center rounded-control border border-[#0f1e3d]/30 bg-white px-5 py-3 text-sm font-semibold text-[#0f1e3d] transition hover:bg-[#f7f9ff]"
            >
              בניית תוכנית אישית
            </Link>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#1b3366] bg-gradient-to-br from-[#0f1e3d] via-[#142a54] to-[#0f1e3d] p-6 text-white shadow-lift md:p-9">
          <SectionTitle
            kicker={isFree ? "גישה פתוחה" : "המסלול המלא"}
            title={isFree ? "הכל פתוח — בלי תשלום" : "מה מקבלים בגישה מלאה"}
            subtitle={
              isFree
                ? "שיעורים, בוחנים אדפטיביים, סימולציות מלאות ומשוב AI — זמינים עכשיו לחלוטין חינם."
                : "שיעורים, בוחנים אדפטיביים, סימולציות מלאות, דשבורד אישי ומשוב AI — הכל במקום אחד."
            }
            light
          />
          <div className="mt-5 grid gap-2 text-sm text-white/85 md:grid-cols-2">
            <p>• בנק שאלות מלא לפי רמות</p>
            <p>• סימולציות מבחן בזמן אמת</p>
            <p>• ניתוח חולשות אוטומטי</p>
            <p>• מעקב שיפור והמלצות המשך</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {isFree ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-control bg-[#d4a843] px-6 py-3 text-sm font-bold text-[#0f1e3d] shadow-cta transition hover:bg-[#e7bb59]"
              >
                כניסה לקורס המלא ←
              </Link>
            ) : (
              <Link
                href="/prep/pricing"
                className="inline-flex items-center justify-center rounded-control bg-[#d4a843] px-6 py-3 text-sm font-bold text-[#0f1e3d] shadow-cta transition hover:bg-[#e7bb59]"
              >
                מעבר למסלול המלא
              </Link>
            )}
            <Link
              href={dashboardHref}
              className="inline-flex items-center justify-center rounded-control border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              צפייה בדשבורד
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/60">{title} · {description}</p>
        </section>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-4">
        <div className="mx-auto flex max-w-[1100px] justify-center md:justify-start">
          <Link
            href={isFree ? dashboardHref : demoQuizHref}
            className="pointer-events-auto inline-flex w-full items-center justify-center rounded-control bg-[#0f1e3d] px-6 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-[#16306a] md:w-auto"
          >
            {isFree ? "כניסה לקורס המלא ←" : "נסה מבחן חינם"}
          </Link>
        </div>
      </div>
    </div>
  );
}
