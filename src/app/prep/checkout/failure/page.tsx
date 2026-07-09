import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "התשלום לא הושלם",
  robots: { index: false },
};

/** הודעות ידידותיות לקודי תשובה נפוצים של Hyp/Yaad (CCode). */
const CCODE_MESSAGES: Record<string, string> = {
  "1": "העסקה לא אושרה על ידי חברת האשראי. כדאי לוודא את פרטי הכרטיס או לנסות כרטיס אחר.",
  "2": "העסקה לא אושרה - כרטיס חסום או מוגבל. פנו לחברת האשראי.",
  "3": "העסקה לא אושרה - קוד שגוי. נסו שוב בזהירות.",
  "4": "העסקה נדחתה על ידי חברת האשראי.",
  "6": "העסקה נדחתה - סירוב חברת האשראי. אפשר לנסות כרטיס אחר.",
  "33": "פרטי הכרטיס שגויים. בדקו מספר, תוקף ו-CVV ונסו שוב.",
  "800": "העסקה בוטלה.",
};

const REASON_MESSAGES: Record<string, string> = {
  verify: "לא הצלחנו לאמת את התשלום מול חברת הסליקה. אם חויבתם - פנו לתמיכה ונטפל בזה מיד.",
  order: "לא נמצאה עסקה תואמת. אם חויבתם - פנו לתמיכה עם צילום האישור.",
  amount: "זוהתה אי-התאמה בסכום העסקה. לא בוצע חיוב על הגישה - פנו לתמיכה.",
  server: "שגיאת מערכת זמנית. אם חויבתם - הגישה תוענק אוטומטית; אחרת נסו שוב.",
  plan: "התוכנית שנרכשה אינה מזוהה. פנו לתמיכה ונסדיר את הגישה.",
};

export default function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: { code?: string; reason?: string; order?: string };
}) {
  const message =
    (searchParams.code && CCODE_MESSAGES[searchParams.code]) ??
    (searchParams.reason && REASON_MESSAGES[searchParams.reason]) ??
    "התשלום לא הושלם. לא בוצע חיוב - אפשר לנסות שוב.";

  return (
    <Container max="measure" className="py-12" dir="rtl">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white">
            ✕
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink">התשלום לא הושלם</h1>
          <Text as="p" variant="body" className="mt-2 text-muted">
            {message}
          </Text>
          {searchParams.order ? (
            <p className="mt-3 font-mono text-xs text-muted" translate="no">
              מספר הזמנה: {searchParams.order}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`${PREP_BASE}/pricing`}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-card transition hover:opacity-90"
          >
            נסו שוב
          </Link>
          <a
            href={`mailto:support@getprepared.academy?subject=${encodeURIComponent("בעיה בתשלום")}${
              searchParams.order ? encodeURIComponent(` - הזמנה ${searchParams.order}`) : ""
            }`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-6 text-sm font-semibold text-primary"
          >
            פנו לתמיכה
          </a>
        </div>
      </div>
    </Container>
  );
}
