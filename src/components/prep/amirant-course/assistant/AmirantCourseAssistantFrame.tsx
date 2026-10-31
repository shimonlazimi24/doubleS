"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AmirantCourseChatPanel } from "../AmirantCourseChatPanel";
import { useAmirantCourseAssistant } from "./AmirantCourseAssistantProvider";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/**
 * Where the assistant lives relative to the page.
 *
 * Wide screens: a column docked to the start edge, beside the lesson, under the
 * course header - the content shrinks, nothing is covered. Narrow screens: a
 * bottom sheet over the page, with the composer kept above the keyboard.
 */
export function AmirantCourseAssistantFrame({ children }: { children: ReactNode }) {
  const { open, setOpen, available } = useAmirantCourseAssistant();
  const wide = useMediaQuery("(min-width: 1024px)");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const show = open && available;

  // Focus moves into the composer when the assistant opens.
  useEffect(() => {
    if (!show) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(id);
  }, [show, wide]);

  // Escape closes the assistant wherever focus is; a control that handles Escape
  // itself (the vocabulary field) stops the event before it gets here.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, close]);

  if (wide) {
    return (
      <div className="flex w-full min-w-0 items-start">
        {show ? (
          <aside
            id="amirant-course-assistant"
            aria-label="עוזר הקורס"
            className="sticky top-14 h-[calc(100dvh-3.5rem)] w-[400px] shrink-0 border-e border-line bg-paper"
          >
            <AmirantCourseChatPanel variant="side" onClose={close} inputRef={inputRef} />
          </aside>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  return (
    <>
      {children}
      {show ? <BottomSheet onClose={close} inputRef={inputRef} /> : null}
    </>
  );
}

function BottomSheet({ onClose, inputRef }: { onClose: () => void; inputRef: React.RefObject<HTMLTextAreaElement> }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const dragStartY = useRef<number | null>(null);

  // The page behind the sheet does not scroll while it is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // iOS does not shrink the layout viewport for the keyboard; the visual viewport
  // says how much is hidden, and the sheet lifts by that much.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKeyboardInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !sheetRef.current) return;
    // Focus stays inside the sheet.
    const nodes = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // A short drag down on the handle closes the sheet.
  const onHandlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    dragStartY.current = e.clientY;
  };
  const onHandlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const start = dragStartY.current;
    dragStartY.current = null;
    if (start != null && e.clientY - start > 48) onClose();
  };

  return (
    <div className="fixed inset-0 z-[120]" role="presentation" style={{ bottom: keyboardInset }}>
      <button type="button" aria-label="סגירת עוזר הקורס" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div
        ref={sheetRef}
        id="amirant-course-assistant"
        role="dialog"
        aria-modal="true"
        aria-label="עוזר הקורס"
        onKeyDown={onKeyDown}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col border-t border-line bg-paper motion-safe:animate-lesson-step-in"
        style={{ height: "min(85dvh, 40rem)" }}
      >
        <button
          type="button"
          onClick={onClose}
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
          aria-label="סגירת עוזר הקורס"
          className="flex h-6 w-full shrink-0 touch-none items-center justify-center"
        >
          <span aria-hidden className="h-1 w-9 rounded-full bg-line" />
        </button>
        <div className="min-h-0 flex-1">
          <AmirantCourseChatPanel variant="sheet" onClose={onClose} inputRef={inputRef} />
        </div>
      </div>
    </div>
  );
}
