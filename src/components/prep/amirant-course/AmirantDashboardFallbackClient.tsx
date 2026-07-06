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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>נושאים חלשים</CardTitle>
          <CardBody>
            <ul className="space-y-1 text-sm">
              {weak.length
                ? weak.map((x) => (
                    <li key={x}>{AMIRANT_TOPIC_LABEL_HE[x]}</li>
                  ))
                : <li>אין מספיק נתונים.</li>}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardTitle>נושאים חזקים</CardTitle>
          <CardBody>
            <ul className="space-y-1 text-sm">
              {strong.length
                ? strong.map((x) => (
                    <li key={x}>{AMIRANT_TOPIC_LABEL_HE[x]}</li>
                  ))
                : <li>אין מספיק נתונים.</li>}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
