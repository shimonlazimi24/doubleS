"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/design-system/cn";
import { getMockChatReply } from "@/lib/prep/amirant-demo/mock-data";

type Msg = { role: "user" | "assistant"; text: string; id: string; time: string };

function timeLabel(d = new Date()) {
  return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-[10px] font-black text-white shadow-md ring-2 ring-paper",
        className,
      )}
      aria-hidden
    >
      AI
    </div>
  );
}

function UserAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-high text-sm font-bold text-primary ring-2 ring-paper",
        className,
      )}
      aria-hidden
    >
      א
    </div>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypingDots() {
  const delays = ["0s", "0.2s", "0.4s"] as const;
  return (
    <div className="flex items-center gap-1.5 px-0.5 py-1" aria-label="מקליד…">
      {delays.map((delay, i) => (
        <span
          key={i}
          className="h-2 w-2 animate-chat-dot rounded-full bg-muted/90"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}

const INITIAL: Msg[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "שלום! אני עוזר הלמידה לדמו. שאלו על מבנה המבחן, דקדוק או איך לתזמן חזרות - אענה לפי מילות מפתח (בלי שרת).",
    time: timeLabel(),
  },
];

export function AmirantDemoChat() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const send = useCallback(() => {
    const t = input.trim();
    if (!t || isTyping) return;
    const ts = timeLabel();
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: t, time: ts }]);
    setInput("");
    setIsTyping(true);
    const replyText = getMockChatReply(t);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: replyText, time: timeLabel() },
      ]);
      setIsTyping(false);
    }, 650);
  }, [input, isTyping]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-[1.35rem] border border-line/60 bg-paper shadow-[0_24px_48px_-12px_rgba(36,56,156,0.12)] ring-1 ring-primary/[0.06]">
        <div className="flex items-center gap-3 border-b border-line/50 bg-gradient-to-l from-surface-low/90 to-paper px-4 py-3.5">
          <BotAvatar />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-base font-semibold text-ink">עוזר למידה · אמירנט</p>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                דמו
              </span>
            </div>
            <p className="text-xs text-muted">מקומי · ללא שליחה לענן</p>
          </div>
        </div>

        <div
          ref={listRef}
          className="flex max-h-[min(52vh,420px)] flex-col gap-4 overflow-y-auto bg-gradient-to-b from-canvas/50 to-paper px-3 py-4 md:px-4"
        >
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex w-full justify-start">
                <div className="flex max-w-[min(92%,20rem)] items-end gap-2">
                  <UserAvatar className="mt-0.5" />
                  <div className="flex min-w-0 flex-col items-start gap-1">
                    <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[0.9375rem] leading-relaxed text-white shadow-md shadow-primary/25">
                      {msg.text}
                    </div>
                    <span className="px-1 text-[10px] tabular-nums text-muted opacity-90">{msg.time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex w-full justify-end">
                <div className="flex max-w-[min(92%,20rem)] items-end gap-2">
                  <div className="flex min-w-0 flex-col items-end gap-1">
                    <div className="rounded-2xl rounded-bl-md border border-line/55 bg-paper px-4 py-2.5 text-[0.9375rem] leading-relaxed text-ink shadow-card">
                      {msg.text}
                    </div>
                    <span className="px-1 text-[10px] tabular-nums text-muted opacity-90">{msg.time}</span>
                  </div>
                  <BotAvatar className="mt-0.5" />
                </div>
              </div>
            ),
          )}

          {isTyping && (
            <div className="flex w-full justify-end">
              <div className="flex items-end gap-2">
                <div className="rounded-2xl rounded-bl-md border border-line/50 bg-paper px-4 py-3 shadow-card">
                  <TypingDots />
                </div>
                <BotAvatar className="mt-0.5 opacity-90" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line/50 bg-paper/95 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-paper/85">
          <div className="flex items-end gap-2 rounded-[1.25rem] border border-line/70 bg-surface-low/80 p-1.5 ps-3 shadow-inner transition focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgba(36,56,156,0.12)]">
            <input
              type="text"
              dir="rtl"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="שאלה על אמירנט, דקדוק או תזמון…"
              className="min-h-[44px] min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-0"
              aria-label="הודעה לעוזר הלמידה"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || isTyping}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition",
                input.trim() && !isTyping
                  ? "bg-primary shadow-md shadow-primary/25 hover:bg-primary-hover active:scale-95"
                  : "cursor-not-allowed bg-primary/35",
              )}
              aria-label="שליחה"
            >
              <SendIcon />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">Enter לשליחה · תשובות דמו לחוויית מוצר</p>
        </div>
      </div>
    </div>
  );
}
