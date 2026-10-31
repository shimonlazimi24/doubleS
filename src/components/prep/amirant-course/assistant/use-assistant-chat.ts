"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AMIRANT_COURSE_COACH_EVENT,
  AMIRANT_COURSE_QUESTION_CONTEXT_EVENT,
  getLastAmirantQuestionContext,
  type AmirantCourseCoachEventDetail,
  type AmirantQuestionContextDetail,
} from "@/lib/prep/amirant-lesson-coach-events";
import {
  buildActiveContextPayload,
  buildHistoryPayload,
  finalAnswerText,
  httpErrorToHebrew,
  nextHintSession,
  parseSseLine,
  questionKey,
  type AssistantMessage,
  type AssistantRequestPayload,
  type HintSession,
} from "@/lib/prep/amirant-course-assistant/chat-client";
import { normalizeModelLineBreaks } from "@/lib/amirant-course/ai/model-text";
import { heApiError } from "@/lib/prep/he-api-error";

export type AssistantChat = {
  messages: AssistantMessage[];
  loading: boolean;
  /** The assistant turn that is still streaming, if any. */
  streamingId: string | null;
  error: string | null;
  hintSession: HintSession | null;
  currentQuestion: AmirantQuestionContextDetail | null;
  /** Prefilled by a lesson block ("עזרו לי עם...") - the composer shows it. */
  draft: string;
  setDraft: (v: string) => void;
  send: (payload: AssistantRequestPayload) => Promise<void>;
  sendText: (text: string) => Promise<void>;
  /** Re-sends the last payload after an error. */
  retry: () => Promise<void>;
  clearError: () => void;
};

const ROUTE = "/api/prep/amirant-course/ai/lesson-chat";

/**
 * The conversation lives here, above the panel, so closing the sheet or resizing
 * the window never drops the thread. Streaming keeps running while it is closed.
 */
export function useAssistantChat(params: { activeLessonId: string | null; pathname: string }): AssistantChat {
  const { activeLessonId, pathname } = params;
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hintSession, setHintSession] = useState<HintSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AmirantQuestionContextDetail | null>(null);
  const [draft, setDraft] = useState("");

  // Refs so `send` (stable) always reads the latest values, and so a second click
  // in the same tick cannot start a second request before React re-renders.
  const inFlight = useRef(false);
  const messagesRef = useRef<AssistantMessage[]>([]);
  const questionRef = useRef<AmirantQuestionContextDetail | null>(null);
  const lessonRef = useRef<string | null>(activeLessonId);
  const lastPayload = useRef<AssistantRequestPayload | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    questionRef.current = currentQuestion;
  }, [currentQuestion]);
  useEffect(() => {
    lessonRef.current = activeLessonId;
  }, [activeLessonId]);

  // A new page means a new screen: the previous question must not ground the next
  // answer. The new page may already have dispatched its block (child effects run
  // before this one), so it is read back rather than lost.
  useEffect(() => {
    setCurrentQuestion(getLastAmirantQuestionContext(pathname));
    setHintSession(null);
    setError(null);
  }, [pathname]);

  // The hint ladder belongs to one question; a new one starts over.
  const qKey = questionKey(currentQuestion);
  useEffect(() => {
    setHintSession(null);
  }, [qKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (payload: AssistantRequestPayload) => {
    const text = payload.userMessage.trim();
    if (!text || inFlight.current) return;
    inFlight.current = true;
    lastPayload.current = payload;
    setError(null);
    setDraft("");
    setLoading(true);

    const { displayText, ...wire } = payload;
    const userMsg: AssistantMessage = { id: `u-${Date.now()}`, role: "user", text: displayText?.trim() || text };
    const assistantId = `a-${Date.now()}`;
    const history = buildHistoryPayload(messagesRef.current);
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", text: "" }]);
    setStreamingId(assistantId);

    // A failed exchange leaves no trace in the thread: "נסו שוב" sends the same payload again.
    const dropAssistant = () => setMessages((m) => m.filter((msg) => msg.id !== assistantId && msg.id !== userMsg.id));
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body: Record<string, unknown> = { ...wire, userMessage: text };
      const lessonId = lessonRef.current;
      if (lessonId) body.lessonId = lessonId;
      const cq = questionRef.current;
      if (cq?.questionText) {
        body.activeQuestionText = cq.questionText.slice(0, 800);
        body.activeContext = buildActiveContextPayload(cq);
      }
      if (cq?.topic && !body.topic) body.topic = cq.topic;
      if (history.length) body.history = history;

      const res = await fetch(ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        // A proxy error page is not JSON; the status still maps to Hebrew copy.
        const data = await res.json().catch(() => null);
        dropAssistant();
        setError(httpErrorToHebrew(res.status, data));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pending = "";
      let rafId: number | null = null;
      let finished = false;

      const flush = () => {
        rafId = null;
        if (!pending) return;
        const chunk = pending;
        pending = "";
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, text: normalizeModelLineBreaks(msg.text + chunk) } : msg)),
        );
      };

      const handle = (line: string) => {
        const ev = parseSseLine(line);
        if (!ev) return;
        if (ev.t === "tok") {
          pending += ev.v;
          if (rafId == null) rafId = window.requestAnimationFrame(flush);
        } else if (ev.t === "done") {
          if (rafId != null) window.cancelAnimationFrame(rafId);
          pending = "";
          const final = normalizeModelLineBreaks(finalAnswerText(ev.d));
          setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, text: final } : msg)));
          setHintSession(nextHintSession(ev.d));
          finished = true;
        } else if (ev.t === "err") {
          if (rafId != null) window.cancelAnimationFrame(rafId);
          pending = "";
          dropAssistant();
          setError(heApiError(ev.e, "העוזר לא הצליח לענות כרגע. נסו שוב בעוד רגע."));
          finished = true;
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handle(line);
      }
      if (buffer.trim()) handle(buffer);
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        flush();
      }
      if (!finished) {
        // The connection closed before `done`: the answer is incomplete, not final.
        dropAssistant();
        setError("החיבור נותק באמצע התשובה. נסו שוב.");
      }
    } catch (e) {
      dropAssistant();
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        console.error("[assistant] request failed:", e);
        setError("שגיאת רשת. בדקו חיבור ונסו שוב.");
      }
    } finally {
      inFlight.current = false;
      abortRef.current = null;
      setStreamingId(null);
      setLoading(false);
    }
  }, []);

  const sendText = useCallback(
    async (raw: string) => {
      setHintSession(null);
      await send({ userMessage: raw, clientAction: "auto" });
    },
    [send],
  );

  const retry = useCallback(async () => {
    const p = lastPayload.current;
    if (p) await send(p);
  }, [send]);

  const clearError = useCallback(() => setError(null), []);

  // Lesson blocks ask for help: prefill, or send at once.
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<AmirantCourseCoachEventDetail>).detail;
      if (!d?.userMessage?.trim()) return;
      setError(null);
      if (d.autoSend) {
        void sendText(d.userMessage);
        return;
      }
      setDraft(d.userMessage);
    };
    window.addEventListener(AMIRANT_COURSE_COACH_EVENT, h);
    return () => window.removeEventListener(AMIRANT_COURSE_COACH_EVENT, h);
  }, [sendText]);

  // The page tells us what is on screen (lesson step, quiz question, passage).
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<AmirantQuestionContextDetail>).detail;
      if (d) setCurrentQuestion(d);
    };
    window.addEventListener(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, h);
    return () => window.removeEventListener(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, h);
  }, []);

  return { messages, loading, streamingId, error, hintSession, currentQuestion, draft, setDraft, send, sendText, retry, clearError };
}
