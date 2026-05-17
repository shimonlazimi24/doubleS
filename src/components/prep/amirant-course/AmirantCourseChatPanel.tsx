"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardBody, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { AMIRANT_COURSE_COACH_EVENT, type AmirantCourseCoachEventDetail } from "@/lib/prep/amirant-lesson-coach-events";

type Msg = { role: "user" | "assistant"; text: string; id: string };

type LessonChatClientPayload = {
  userMessage: string;
  lessonId?: string;
  clientAction?: "auto" | "hint" | "next_hint" | "reveal" | "vocab_lookup" | "performance" | "recommend";
  stagedHintContext?: { stage?: number; questionType?: string };
  vocabularyWord?: string;
  topic?: string;
};

type HintSession = { stage: number; questionType?: string };

export type AmirantCourseChatPanelProps = {
  /** מזהה שיעור ל־RAG; בלי — שאלות לרוחב הקורס */
  activeLessonId?: string | null;
  /** שורה קצרה מעל הצ'אט (למשל \"מיקוד: …\") */
  contextHint?: string;
  /** כותרת; ברירה — עוזר הקורס */
  title?: string;
  className?: string;
  /** פאנל צף — פחות padding / צל */
  compact?: boolean;
};

export function AmirantCourseChatPanel({
  activeLessonId,
  contextHint,
  title = "עוזר הקורס (AI)",
  className,
  compact,
}: AmirantCourseChatPanelProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintSession, setHintSession] = useState<HintSession | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendWithPayload = useCallback(
    async (payload: LessonChatClientPayload) => {
      const t = payload.userMessage.trim();
      if (!t || loading) return;
      setError(null);
      const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: t };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      try {
        const body: Record<string, unknown> = { ...payload, userMessage: t };
        if (activeLessonId) body.lessonId = activeLessonId;
        const res = await fetch("/api/prep/amirant-course/ai/lesson-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          answer?: string;
          safeFallback?: boolean;
          error?: string;
          intent?: string;
          nextHintAvailable?: boolean;
          hintStage?: number | null;
          questionType?: string | null;
          recommendedAction?: string | null;
        };
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "הבקשה נכשלה.");
          return;
        }
        const answer = data.answer ?? "";
        const suffix = data.safeFallback ? "\n\n(מצב זהיר — מידע מוגבל/חסר.)" : "";
        const rec = data.recommendedAction?.trim() ? `\n\n**המלצה:** ${data.recommendedAction}` : "";
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: answer + suffix + rec }]);
        if (data.nextHintAvailable && (data.hintStage ?? 0) < 3) {
          setHintSession({ stage: (data.hintStage ?? 1) + 1, questionType: data.questionType ?? undefined });
        } else if (data.hintStage === 4) {
          setHintSession(null);
        }
      } catch {
        setError("שגיאת רשת.");
      } finally {
        setLoading(false);
      }
    },
    [loading, activeLessonId],
  );

  const sendWithText = useCallback(
    (raw: string) => {
      setHintSession(null);
      return void sendWithPayload({ userMessage: raw, clientAction: "auto" });
    },
    [sendWithPayload],
  );

  const send = useCallback(async () => {
    await sendWithText(input);
  }, [input, sendWithText]);

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<AmirantCourseCoachEventDetail>).detail;
      if (!d?.userMessage?.trim()) return;
      setError(null);
      if (d.autoSend) {
        setInput(d.userMessage);
        window.setTimeout(() => {
          void sendWithText(d.userMessage);
        }, 50);
        return;
      }
      setInput(d.userMessage);
    };
    window.addEventListener(AMIRANT_COURSE_COACH_EVENT, h);
    return () => window.removeEventListener(AMIRANT_COURSE_COACH_EVENT, h);
  }, [sendWithText]);

  const inner = (
    <>
      <Text as="h2" variant="headlineSm" className={cn(compact && "text-base")}>
        {title}
      </Text>
      {contextHint ? (
        <Text as="p" variant="caption" className="text-muted">
          {contextHint}
        </Text>
      ) : null}

      <div
        ref={listRef}
        className={cn(
          "space-y-3 overflow-y-auto rounded-control border border-line/50 bg-surface-low/40 p-3 text-sm",
          compact ? "max-h-[min(50vh,320px)]" : "max-h-[min(40vh,360px)]",
        )}
      >
        {messages.length === 0 ? (
          <p className="text-muted">
            {activeLessonId
              ? "שאלו על תוכן השיעור: ניסוח, אסטרטגיה, או נקודה שלא הובנה."
              : "שאלו כל נושא הקשור לקורס (מבחן, מודול, תרגול). ניסוח ספציפי עוזר."}
          </p>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg px-3 py-2 leading-relaxed",
              msg.role === "user" ? "ms-8 bg-primary/10 text-ink" : "me-8 border border-line/60 bg-paper text-ink",
            )}
          >
            {msg.text}
          </div>
        ))}
        {loading ? <p className="text-xs text-muted">מגיב…</p> : null}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({ userMessage: "תן לי רמז לשאלה (בקצרה)", clientAction: "hint" })}
        >
          תן לי רמז
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() =>
            void sendWithPayload({
              userMessage: "רמז נוסף",
              clientAction: "next_hint",
              stagedHintContext: hintSession
                ? { stage: hintSession.stage, questionType: hintSession.questionType }
                : { stage: 2 },
            })
          }
        >
          רמז נוסף
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({ userMessage: "גלה את התשובה (עם נימוקים מהחומר).", clientAction: "reveal" })}
        >
          גלה תשובה
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => {
            const w = window.prompt("איזו מילה (אנגלית) לבדיקה מול מאגר אוצר המילים?", "")?.trim();
            if (!w) return;
            void sendWithPayload({
              userMessage: `בדיקת מילה: ${w}`,
              clientAction: "vocab_lookup",
              vocabularyWord: w,
            });
          }}
        >
          בדוק מילה
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({ userMessage: "נתח את הביצועים שלי", clientAction: "performance" })}
        >
          ביצועים
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({ userMessage: "מה כדאי לי לעשות עכשיו?", clientAction: "recommend" })}
        >
          מה לעשות
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          dir="rtl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="שאלה…"
          className="min-h-11 min-w-0 flex-1 rounded-control border border-line/70 bg-paper px-3 text-sm text-ink placeholder:text-muted"
          aria-label="הודעה לעוזר"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!input.trim() || loading}
          className="shrink-0 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-45"
        >
          שליחה
        </button>
      </div>
    </>
  );

  if (compact) {
    return (
      <div
        className={cn("flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-line/80 bg-paper shadow-2xl", className)}
      >
        <div className="space-y-2.5 overflow-y-auto p-4">{inner}</div>
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/15", className)}>
      <CardBody className="space-y-3 p-5">{inner}</CardBody>
    </Card>
  );
}

