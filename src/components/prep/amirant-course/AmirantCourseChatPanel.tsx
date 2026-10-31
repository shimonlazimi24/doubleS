"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  ASSISTANT_MESSAGE_MAX,
  remainingCounter,
  truncateStem,
  type AssistantMessage,
} from "@/lib/prep/amirant-course-assistant/chat-client";
import { useAmirantCourseAssistant } from "./assistant/AmirantCourseAssistantProvider";

const STARTER_PROMPTS = [
  "איך כדאי לגשת לשאלות השלמת משפטים?",
  "מה ההבדל בין רמות הקושי במבחן?",
  "איך מנהלים את הזמן במבחן?",
];

/** Plain text buttons: the row's hairlines do the separating, not borders or fills. */
const textButton =
  "inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:cursor-default disabled:text-muted-2 disabled:hover:bg-transparent";

const linkButton =
  "inline-flex min-h-11 items-center text-start text-[15px] leading-6 text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:text-muted-2 disabled:no-underline";

export type AmirantCourseChatPanelProps = {
  /** Side sheet (desktop) or bottom sheet (phone) - same content, different chrome. */
  variant: "side" | "sheet";
  onClose: () => void;
  /** The composer, so the opener can move focus into it. */
  inputRef: RefObject<HTMLTextAreaElement>;
  className?: string;
};

export function AmirantCourseChatPanel({ variant, onClose, inputRef, className }: AmirantCourseChatPanelProps) {
  const { chat, lessonOnScreen, activeLessonId } = useAmirantCourseAssistant();
  const { messages, loading, streamingId, error, hintSession, currentQuestion, draft, setDraft, send, sendText, retry } = chat;
  const [contextHidden, setContextHidden] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [vocabWord, setVocabWord] = useState("");
  const vocabRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // A turn the learner just sent always comes into view; while the answer streams,
  // the thread follows it unless the learner scrolled up to read something earlier.
  const lastUserTurnId = [...messages].reverse().find((m) => m.role === "user")?.id ?? null;
  const seenUserTurn = useRef<string | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const newTurn = lastUserTurnId !== seenUserTurn.current;
    seenUserTurn.current = lastUserTurnId;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (newTurn || nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" });
  }, [messages, lastUserTurnId, reducedMotion]);

  useEffect(() => {
    if (vocabOpen) vocabRef.current?.focus();
  }, [vocabOpen]);

  const submitVocab = (e: FormEvent) => {
    e.preventDefault();
    const w = vocabWord.trim();
    if (!w) return;
    setVocabOpen(false);
    setVocabWord("");
    void send({ userMessage: `בדיקת מילה: ${w}`, displayText: `בדיקת מילה: ${w}`, clientAction: "vocab_lookup", vocabularyWord: w });
  };

  const hasConversation = messages.length > 0;
  // Hints and the solution belong to a question; a content slide gets only the general actions.
  const questionOnScreen = currentQuestion?.kind === "quiz_question" || Boolean(currentQuestion?.options?.length);
  // Timed unit and no answer yet: the server would refuse anyway; say so instead of offering it.
  const revealLocked = Boolean(currentQuestion?.timed) && currentQuestion?.answered !== true;

  const generalActions = (
    <GeneralActions
      disabled={loading}
      onVocab={() => setVocabOpen(true)}
      onPerformance={() => void send({ userMessage: "נתח את הביצועים שלי", displayText: "הביצועים שלי", clientAction: "performance" })}
      onRecommend={() => void send({ userMessage: "מה כדאי לי לעשות עכשיו?", displayText: "מה כדאי עכשיו", clientAction: "recommend" })}
    />
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-paper text-ink", className)} dir="rtl" lang="he">
      {/* Header: the product label and the one control. The sheet adds its handle above this. */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line ps-5 pe-2">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] font-extrabold tracking-wide text-primary" aria-hidden>
            PREPARE
          </span>
          <Text as="h2" variant="title" className="text-base">
            עוזר הקורס
          </Text>
        </div>
        <button type="button" onClick={onClose} className={textButton} aria-label="סגירת עוזר הקורס">
          סגירה
        </button>
      </div>

      {currentQuestion ? (
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line ps-5 pe-2 py-1.5">
          {contextHidden ? (
            <Text as="p" variant="caption" className="py-2.5">
              על המסך: מוסתר
            </Text>
          ) : (
            <Text as="p" variant="caption" className="min-w-0 truncate py-2.5" title={truncateStem(currentQuestion.questionText, 300)}>
              <span className="text-ink/70">על המסך: </span>
              <span dir="auto">{truncateStem(currentQuestion.questionText, 160)}</span>
            </Text>
          )}
          <button
            type="button"
            onClick={() => setContextHidden((v) => !v)}
            className={cn(textButton, "shrink-0 text-xs")}
            aria-pressed={contextHidden}
          >
            {contextHidden ? "הצג" : "הסתר"}
          </button>
        </div>
      ) : null}

      {/* The thread */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="השיחה עם העוזר"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [-webkit-overflow-scrolling:touch]"
      >
        {!hasConversation ? (
          <div className="space-y-6">
            <Text as="p" variant="body" className="text-[15px] leading-7">
              {lessonOnScreen
                ? "שאלו על השיעור הפתוח: ניסוח, אסטרטגיה, או נקודה שלא הובנה."
                : activeLessonId
                  ? "שאלו על השיעור האחרון שנפתח, או על כל נושא בקורס."
                  : "שאלו על המבחן, על שאלה שעל המסך, או על נושא מהקורס."}
            </Text>
            <ul className="space-y-1">
              {STARTER_PROMPTS.map((q) => (
                <li key={q}>
                  <button type="button" disabled={loading} onClick={() => void sendText(q)} className={linkButton}>
                    {q}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-4">
              <Text as="p" variant="caption" className="mb-1">
                עוד אפשרויות
              </Text>
              {generalActions}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <Turn key={m.id} message={m} streaming={m.id === streamingId} />
            ))}
          </div>
        )}
      </div>

      {/* Question actions: one row, hairlines between, text only. */}
      {currentQuestion && questionOnScreen ? (
        <div className="flex shrink-0 items-stretch border-t border-line">
          <div className="flex min-w-0 flex-1 items-stretch divide-x divide-x-reverse divide-line">
            <button
              type="button"
              className={cn(textButton, "px-4")}
              disabled={loading}
              onClick={() =>
                void send({
                  userMessage: `תן לי רמז לשאלה הזאת (בקצרה): "${truncateStem(currentQuestion.questionText, 120)}"`,
                  displayText: "רמז",
                  clientAction: "hint",
                  topic: currentQuestion.topic,
                  stagedHintContext: { questionType: currentQuestion.questionType },
                })
              }
            >
              רמז
            </button>
            {hintSession ? (
              <button
                type="button"
                className={cn(textButton, "px-4")}
                disabled={loading}
                onClick={() =>
                  void send({
                    userMessage: "רמז נוסף",
                    displayText: "רמז נוסף",
                    clientAction: "next_hint",
                    topic: currentQuestion.topic,
                    stagedHintContext: { stage: hintSession.stage, questionType: hintSession.questionType ?? currentQuestion.questionType },
                  })
                }
              >
                רמז נוסף
              </button>
            ) : null}
            {revealLocked ? (
              <span className="inline-flex min-h-11 items-center px-4 text-sm text-muted-2">הפתרון ייפתח אחרי שתענו</span>
            ) : (
              <button
                type="button"
                className={cn(textButton, "px-4")}
                disabled={loading}
                onClick={() =>
                  void send({
                    userMessage: `גלה את התשובה לשאלה הזאת עם הסבר: "${truncateStem(currentQuestion.questionText, 120)}"`,
                    displayText: "פתרון",
                    clientAction: "reveal",
                    topic: currentQuestion.topic,
                  })
                }
              >
                פתרון
              </button>
            )}
          </div>
          {hasConversation ? <MoreDisclosure>{generalActions}</MoreDisclosure> : null}
        </div>
      ) : hasConversation ? (
        <div className="flex shrink-0 justify-end border-t border-line">
          <MoreDisclosure>{generalActions}</MoreDisclosure>
        </div>
      ) : null}

      {vocabOpen ? (
        <form onSubmit={submitVocab} className="flex shrink-0 items-end gap-2 border-t border-line px-4 py-3">
          <label className="min-w-0 flex-1">
            <Text as="span" variant="caption" className="mb-1 block">
              מילה באנגלית לבדיקה מול מאגר אוצר המילים
            </Text>
            <input
              ref={vocabRef}
              type="text"
              dir="ltr"
              lang="en"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={80}
              value={vocabWord}
              onChange={(e) => setVocabWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setVocabOpen(false);
                }
              }}
              className="min-h-11 w-full rounded-control border border-line bg-paper px-3 text-[15px] text-ink placeholder:text-muted-2 focus:border-primary focus:outline-none"
              placeholder="reluctant"
            />
          </label>
          <button type="submit" disabled={!vocabWord.trim() || loading} className={textButton}>
            בדיקה
          </button>
          <button type="button" onClick={() => setVocabOpen(false)} className={cn(textButton, "text-muted")}>
            ביטול
          </button>
        </form>
      ) : null}

      <Composer
        inputRef={inputRef}
        value={draft}
        onChange={setDraft}
        onSend={() => void sendText(draft)}
        disabled={loading}
        error={error}
        onRetry={() => void retry()}
        variant={variant}
      />
    </div>
  );
}

function Turn({ message, streaming }: { message: AssistantMessage; streaming: boolean }) {
  if (message.role === "user") {
    return (
      <div className="ms-8 rounded bg-surface-low px-3.5 py-2.5 text-[15px] leading-7 text-ink">
        <p className="whitespace-pre-line [overflow-wrap:anywhere]" dir="auto">
          {message.text}
        </p>
      </div>
    );
  }
  return (
    <div className="me-2">
      <p className="mb-1 text-[11px] font-bold tracking-wide text-muted-2" aria-hidden>
        PREPARE
      </p>
      {message.text ? (
        <div className="text-[15px] leading-7 [&_li]:text-[15px] [&_li]:leading-7 [&_p]:text-[15px] [&_p]:leading-7">
          <PremiumMarkdownBody body={message.text} variant="card" />
          {streaming ? <StreamCaret /> : null}
        </div>
      ) : (
        <p className="text-[15px] leading-7 text-muted">
          כותב…
          <span className="sr-only">העוזר מכין תשובה</span>
        </p>
      )}
    </div>
  );
}

function StreamCaret() {
  return <span aria-hidden className="ms-0.5 inline-block h-4 w-px translate-y-[3px] bg-ink/60 motion-safe:animate-pulse" />;
}

function GeneralActions({
  disabled,
  onVocab,
  onPerformance,
  onRecommend,
}: {
  disabled: boolean;
  onVocab: () => void;
  onPerformance: () => void;
  onRecommend: () => void;
}) {
  return (
    <ul className="divide-y divide-line">
      <li>
        <button type="button" disabled={disabled} onClick={onVocab} className={linkButton}>
          בדיקת מילה
        </button>
      </li>
      <li>
        <button type="button" disabled={disabled} onClick={onPerformance} className={linkButton}>
          הביצועים שלי
        </button>
      </li>
      <li>
        <button type="button" disabled={disabled} onClick={onRecommend} className={linkButton}>
          מה כדאי עכשיו
        </button>
      </li>
    </ul>
  );
}

/** The general actions once a conversation exists: behind a plain text disclosure. */
function MoreDisclosure({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0 border-s border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={cn(textButton, "px-4")}>
        {open ? "סגירה" : "עוד"}
      </button>
      {open ? (
        <div className="absolute bottom-full end-0 z-10 mb-px w-56 border border-line bg-paper px-4 py-1">
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function Composer({
  inputRef,
  value,
  onChange,
  onSend,
  disabled,
  error,
  onRetry,
  variant,
}: {
  inputRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  error: string | null;
  onRetry: () => void;
  variant: "side" | "sheet";
}) {
  const remaining = remainingCounter(value.length);
  const canSend = Boolean(value.trim()) && !disabled;

  // Grows with the text up to four lines, then scrolls.
  const grow = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputRef]);
  useLayoutEffect(grow, [value, grow]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className={cn("shrink-0 border-t border-line px-4 pt-3", variant === "sheet" ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "pb-3")}>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">הודעה לעוזר</span>
          <textarea
            ref={inputRef}
            rows={1}
            dir="auto"
            value={value}
            maxLength={ASSISTANT_MESSAGE_MAX}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="כתבו שאלה…"
            aria-describedby={error ? "amirant-assistant-error" : undefined}
            aria-invalid={error ? true : undefined}
            className="block max-h-[120px] min-h-11 w-full resize-none rounded-control border border-line bg-paper px-3 py-2.5 text-[15px] leading-6 text-ink placeholder:text-muted-2 focus:border-primary focus:outline-none disabled:text-muted"
          />
        </label>
        <button type="button" onClick={onSend} disabled={!canSend} className={cn(textButton, "shrink-0")}>
          שליחה
        </button>
      </div>
      <div className="mt-1.5 flex min-h-5 items-start justify-between gap-3">
        {error ? (
          <p id="amirant-assistant-error" role="alert" className="text-sm leading-5 text-pen">
            {error}{" "}
            <button type="button" onClick={onRetry} className="font-semibold text-primary underline underline-offset-4">
              נסו שוב
            </button>
          </p>
        ) : variant === "side" ? (
          <Text as="p" variant="caption" className="text-xs">
            Enter לשליחה, Shift+Enter לשורה חדשה
          </Text>
        ) : (
          <span />
        )}
        {remaining != null ? (
          <Text as="p" variant="caption" className={cn("shrink-0 text-xs tabular-nums", remaining === 0 && "text-pen")} aria-live="polite">
            נותרו {remaining}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
