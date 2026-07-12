"use client";

import {
  buildNextBestActionForLocal,
  loadAmirantProgressState,
  loadAnalytics,
  strongTopics,
  weakTopics,
} from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_TOPIC_LABEL_HE } from "@/lib/amirant-course/topic-labels";
import type { AmirantBankTopicSlug } from "@/lib/amirant-course/types/bank-question";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";
import { AmirantNextBestActionCard } from "@/components/prep/amirant-course/AmirantNextBestActionCard";

const COURSE = `${PREP_BASE}/amirant/course`;

export function AmirantDashboardFallbackClient() {
  const analytics = loadAnalytics();
  const progress = loadAmirantProgressState();
  const recommended = buildNextBestActionForLocal(analytics, progress, COURSE);
  const weak = weakTopics(analytics, 3) as AmirantBankTopicSlug[];
  const strong = strongTopics(analytics, 3) as AmirantBankTopicSlug[];

  return (
    <div className="space-y-6">
      <Text as="h1" variant="titlePage">
        לוח תלמיד
      </Text>
      <Text as="p" variant="bodySm" className="text-muted">
        מוצגת התקדמות מהמכשיר הזה. התחברו כדי לשמור את ההתקדמות בחשבון ולסנכרן בין מכשירים.
      </Text>

      <AmirantNextBestActionCard action={recommended} className="border-primary/20" />

      {/* ניתוח לפי נושאים - סקשן שטוח אחד; empty state מנחה (DESIGN_GUIDELINES) */}
      <section className="border-t border-line pt-6">
        <h2 className="text-lg font-bold text-primary">ניתוח לפי נושאים</h2>
        {weak.length || strong.length ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted">כדאי לחזק</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {weak.length ? (
                  weak.map((x) => <li key={x}>{AMIRANT_TOPIC_LABEL_HE[x]}</li>)
                ) : (
                  <li className="text-muted">אין נושאים חלשים בולטים 👏</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted">חזקים אצלכם</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {strong.length ? (
                  strong.map((x) => <li key={x}>{AMIRANT_TOPIC_LABEL_HE[x]}</li>)
                ) : (
                  <li className="text-muted">עוד אין מספיק נתונים</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            השלימו תרגול או בוחן ראשון - ותראו כאן אילו נושאים חזקים אצלכם ומה כדאי לחזק.
          </p>
        )}
      </section>
    </div>
  );
}
