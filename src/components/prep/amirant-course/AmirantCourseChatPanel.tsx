"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardBody, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import {
  AMIRANT_COURSE_COACH_EVENT,
  AMIRANT_COURSE_QUESTION_CONTEXT_EVENT,
  type AmirantCourseCoachEventDetail,
  type AmirantQuestionContextDetail,
} from "@/lib/prep/amirant-lesson-coach-events";
import { heApiError } from "@/lib/prep/he-api-error";

type Msg = { role: "user" | "assistant"; text: string; id: string };

type LessonChatClientPayload = {
  userMessage: string;
  lessonId?: string;
  clientAction?: "auto" | "hint" | "next_hint" | "reveal" | "vocab_lookup" | "performance" | "recommend";
  stagedHintContext?: { stage?: number; questionType?: string };
  vocabularyWord?: string;
  topic?: string;
};

/** עד 8 תורות אחרונים, חתוכים ל-600 תווים - כדי שהעוזר יזכור את השיחה. */
function buildHistoryPayload(messages: Msg[]): { role: "user" | "assistant"; text: string }[] {
  return messages
    .filter((m) => m.text.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 600) }));
}

const STARTER_PROMPTS = [
  "איך כדאי לגשת לשאלות השלמת משפטים?",
  "מה ההבדל בין רמות הקושי במבחן?",
  "תן לי טיפ לניהול זמן במבחן",
];

type HintSession = { stage: number; questionType?: string };

export type AmirantCourseChatPanelProps = {
  /** מזהה שיעור ל־RAG; בלי - שאלות לרוחב הקורס */
  activeLessonId?: string | null;
  /** שורה קצרה מעל הצ'אט (למשל \"מיקוד: …\") */
  contextHint?: string;
  /** כותרת; ברירה - עוזר הקורס */
  title?: string;
  className?: string;
  /** פאנל צף - פחות padding / צל */
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
  const [currentQuestion, setCurrentQuestion] = useState<AmirantQuestionContextDetail | null>(null);
  // Ref so sendWithPayload (memoized on loading/activeLessonId) can always read the latest value
  const currentQuestionRef = useRef<AmirantQuestionContextDetail | null>(null);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  // בזמן השליחה ה-ref עוד לא כולל את ההודעה החדשה - בדיוק ההיסטוריה שרוצים לשלוח
  const messagesRef = useRef<Msg[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
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

      const assistantId = `a-${Date.now()}`;
      // Placeholder message that we'll update with streamed tokens
      setMessages((m) => [...m, { id: assistantId, role: "assistant", text: "" }]);

      try {
        const body: Record<string, unknown> = { ...payload, userMessage: t };
        if (activeLessonId) body.lessonId = activeLessonId;
        const cq = currentQuestionRef.current;
        if (cq?.questionText && !body.activeQuestionText) body.activeQuestionText = cq.questionText.slice(0, 800);
        if (cq?.topic && !body.topic) body.topic = cq.topic;
        // היסטוריית השיחה (בלי ההודעה הנוכחית שכבר ב-userMessage)
        const history = buildHistoryPayload(messagesRef.current);
        if (history.length) body.history = history;

        const res = await fetch("/api/prep/amirant-course/ai/lesson-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
          const data = await res.json() as { error?: string };
          setMessages((m) => m.filter((msg) => msg.id !== assistantId));
          setError(heApiError(data.error, "הבקשה נכשלה."));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let pendingTok = "";
        let rafId: number | null = null;

        const flushTok = () => {
          rafId = null;
          if (!pendingTok) return;
          const chunk = pendingTok;
          pendingTok = "";
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg)),
          );
        };

        const processLine = (line: string) => {
          if (!line.startsWith("data: ")) return;
          try {
            const event = JSON.parse(line.slice(6)) as { t: string; v?: string; d?: Record<string, unknown>; e?: string };
            if (event.t === "tok" && event.v) {
              pendingTok += event.v;
              if (rafId == null) rafId = window.requestAnimationFrame(flushTok);
            } else if (event.t === "done" && event.d) {
              if (rafId != null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
              }
              flushTok();
              const data = event.d;
              const suffix = data.safeFallback ? "\n\n(מצב זהיר - מידע מוגבל/חסר.)" : "";
              const rec = typeof data.recommendedAction === "string" && data.recommendedAction.trim()
                ? `\n\n**המלצה:** ${data.recommendedAction}` : "";
              const finalAnswer = (typeof data.answer === "string" ? data.answer : "") + suffix + rec;
              setMessages((m) =>
                m.map((msg) => msg.id === assistantId ? { ...msg, text: finalAnswer } : msg),
              );
              if (data.nextHintAvailable && (Number(data.hintStage) || 0) < 3) {
                setHintSession({ stage: (Number(data.hintStage) || 1) + 1, questionType: typeof data.questionType === "string" ? data.questionType : undefined });
              } else if (data.hintStage === 4) {
                setHintSession(null);
              }
            } else if (event.t === "err") {
              if (rafId != null) window.cancelAnimationFrame(rafId);
              setMessages((m) => m.filter((msg) => msg.id !== assistantId));
              setError(heApiError(event.e, "שגיאה."));
            }
          } catch {
            // ignore malformed SSE line
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.trim()) processLine(line);
          }
        }
        if (rafId != null) {
          window.cancelAnimationFrame(rafId);
          flushTok();
        }
      } catch {
        setMessages((m) => m.filter((msg) => msg.id !== assistantId));
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

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<AmirantQuestionContextDetail>).detail;
      if (d) setCurrentQuestion(d);
    };
    window.addEventListener(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, h);
    return () => window.removeEventListener(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, h);
  }, []);

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
          <div className="space-y-2.5">
            <p className="text-muted">
              {activeLessonId
                ? "שאלו על תוכן השיעור: ניסוח, אסטרטגיה, או נקודה שלא הובנה."
                : "שאלו כל נושא הקשור לקורס (מבחן, מודול, תרגול). ניסוח ספציפי עוזר."}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendWithText(q)}
                  className="rounded-full border border-primary/25 bg-paper px-3 py-1.5 text-xs text-primary transition hover:bg-primary/5"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg px-3 py-2 leading-relaxed",
              msg.role === "user" ? "ms-8 bg-primary/10 text-ink" : "me-8 border border-line/60 bg-paper text-ink",
            )}
          >
            {msg.role === "assistant" ? (
              msg.text ? (
                <PremiumMarkdownBody body={msg.text} variant="card" />
              ) : (
                <span className="inline-flex gap-1 text-muted" aria-label="העוזר מקליד">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce [animation-delay:120ms]">·</span>
                  <span className="animate-bounce [animation-delay:240ms]">·</span>
                </span>
              )
            ) : (
              <span className="whitespace-pre-line">{msg.text}</span>
            )}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {currentQuestion && (
        <div className="rounded-lg border border-line/40 bg-surface-low/60 px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-ink/70">שאלה נוכחית: </span>
          {currentQuestion.questionText.slice(0, 80)}{currentQuestion.questionText.length > 80 ? "…" : ""}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({
            userMessage: currentQuestion
              ? `תן לי רמז לשאלה הזאת (בקצרה): "${currentQuestion.questionText.slice(0, 120)}"`
              : "תן לי רמז לשאלה (בקצרה)",
            clientAction: "hint",
            topic: currentQuestion?.topic,
            stagedHintContext: { questionType: currentQuestion?.questionType },
          })}
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
              topic: currentQuestion?.topic,
              stagedHintContext: hintSession
                ? { stage: hintSession.stage, questionType: hintSession.questionType ?? currentQuestion?.questionType }
                : { stage: 2, questionType: currentQuestion?.questionType },
            })
          }
        >
          רמז נוסף
        </button>
        <button
          type="button"
          className="rounded-md border border-line/60 bg-paper/90 px-2 py-1 text-xs text-ink/90 hover:border-primary/30 disabled:opacity-50"
          disabled={loading}
          onClick={() => void sendWithPayload({
            userMessage: currentQuestion
              ? `גלה את התשובה לשאלה הזאת עם הסבר: "${currentQuestion.questionText.slice(0, 120)}"`
              : "גלה את התשובה (עם נימוקים מהחומר).",
            clientAction: "reveal",
            topic: currentQuestion?.topic,
          })}
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

