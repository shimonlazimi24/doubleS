"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, Text } from "@/components/ui";
import { buildWeakQuizRequestFromLocalAnalytics } from "@/lib/amirant-course/weak-quiz-build-local";
import { generateWeakTopicsQuiz } from "@/lib/amirant-course/weak-quiz";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantPracticeSetClient } from "./AmirantPracticeSetClient";

const COURSE = `${PREP_BASE}/amirant/course`;

/**
 * Fetches 16-question weak-topic set: API when signed in, else local generator.
 */
export function AmirantWeakQuizPageClient() {
  const [error, setError] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<string[] | null>(null);

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
              if (!cancelled) setQuestionIds(data.questionIds);
              return;
            }
          }
        }

        const out = generateWeakTopicsQuiz({ input, recentQuestionIds: [] });
        if (!cancelled) setQuestionIds(out.questionIds);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "שגיאה");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (!questionIds) {
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
          ← קורס
        </Link>
        <span className="mx-2 text-line">/</span>
        <span>תרגול ממוקד</span>
      </div>
      <AmirantPracticeSetClient
        title="תרגול ממוקד - הנושאים שכדאי לחזק"
        questionIds={questionIds}
        variant="weak_quiz"
      />
    </div>
  );
}
