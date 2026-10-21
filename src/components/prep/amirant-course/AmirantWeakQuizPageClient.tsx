"use client";

import { useEffect, useState } from "react";
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { Card, CardBody, Text } from "@/components/ui";
import { buildWeakQuizRequestFromLocalAnalytics } from "@/lib/amirant-course/weak-quiz-build-local";
import { generateWeakTopicsQuiz, type PickableQuestion } from "@/lib/amirant-course/weak-quiz";
import { fetchClientQuestionSet } from "@/lib/amirant-course/question-set-client";
import type { ClientQuestionSet } from "@/lib/amirant-course/question-bank/client-types";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantPracticeSetClient } from "./AmirantPracticeSetClient";

const COURSE = `${PREP_BASE}/amirant/course`;

/**
 * Fetches 16-question weak-topic set: API when signed in, else local generator
 * over `pool` (the general bank's ids, topics and levels — no question text).
 * The chosen questions are then fetched by id.
 */
export function AmirantWeakQuizPageClient({ pool }: { pool: PickableQuestion[] }) {
  const [error, setError] = useState<string | null>(null);
  const [questionSet, setQuestionSet] = useState<ClientQuestionSet | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const client = createPrepSupabaseBrowserClient();
        const { data: { user } } = client
          ? await client.auth.getUser()
          : { data: { user: null } };

        const userId = user?.id ?? "local-anonymous";
        const input = buildWeakQuizRequestFromLocalAnalytics(userId);

        let questionIds: string[] | null = null;
        if (user && client) {
          const res = await fetch("/api/prep/amirant-course/generate-weak-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, userId: user.id }),
            credentials: "include",
          });
          if (res.ok) {
            const data = (await res.json()) as { questionIds?: string[] };
            if (Array.isArray(data.questionIds) && data.questionIds.length === 16) {
              questionIds = data.questionIds;
            }
          }
        }
        if (!questionIds) {
          questionIds = generateWeakTopicsQuiz({ input, recentQuestionIds: [], bank: pool }).questionIds;
        }

        const set = await fetchClientQuestionSet(questionIds);
        if (!cancelled) setQuestionSet(set);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "שגיאה");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pool]);

  if (error) {
    return (
      <div className="space-y-4">
        <Text as="p" variant="body" className="text-red-600">
          {error}
        </Text>
        <Link href={COURSE} className="text-sm font-semibold text-primary">
          חזרה לקורס
        </Link>
      </div>
    );
  }

  if (!questionSet) {
    return (
      <Card className="border-primary/20 bg-surface-low/50">
        <CardBody className="space-y-2 p-4">
          <Text as="p" variant="body" className="font-semibold text-ink">
            בונים בוחן לפי חולשותיך
          </Text>
          <Text as="p" variant="bodySm" className="text-muted">
            בוחרים שאלות לפי נתוני הניסיונות - רגע אחד.
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted">
        <Link href={COURSE} className="font-semibold text-primary hover:underline">
          קורס
        </Link>
        <span className="mx-2 text-line">/</span>
        <span>תרגול ממוקד</span>
      </div>
      <AmirantPracticeSetClient
        title="תרגול ממוקד - הנושאים שכדאי לחזק"
        questionSet={questionSet}
        variant="weak_quiz"
      />
    </div>
  );
}
