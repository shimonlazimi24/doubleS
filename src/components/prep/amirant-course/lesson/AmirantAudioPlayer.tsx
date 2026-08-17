"use client";

/**
 * נגן שמיעה לשיעורי AMIRNET.
 * מצב מבחן: מספר השמעות מוגבל (ברירת מחדל 1).
 * כשאין קובץ — placeholder כנה + הנחיה לתמליל.
 */
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/design-system/cn";
import {
  getListeningAudioClip,
  type ListeningAudioClip,
} from "@/lib/amirant-course/listening-audio/manifest";

type Props = {
  /** מזהה מהמניפסט או URL / נתיב ישיר לקובץ */
  audioRef: string;
  title?: string;
  className?: string;
};

type Resolved = {
  clip: ListeningAudioClip | null;
  src: string | null;
  title: string;
  examReplayLimit: number;
};

function resolveClip(audioRef: string, titleOverride?: string): Resolved {
  const trimmed = audioRef.trim();
  const fromManifest = getListeningAudioClip(trimmed);
  if (fromManifest) {
    return {
      clip: fromManifest,
      src: fromManifest.src?.trim() || null,
      title: titleOverride?.trim() || fromManifest.title,
      examReplayLimit: fromManifest.examReplayLimit,
    };
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return {
      clip: null,
      src: trimmed,
      title: titleOverride?.trim() || "קטע שמיעה",
      examReplayLimit: 1,
    };
  }
  return {
    clip: null,
    src: null,
    title: titleOverride?.trim() || "קטע שמיעה",
    examReplayLimit: 1,
  };
}

export function AmirantAudioPlayer({ audioRef, title, className }: Props) {
  const { clip, src, title: displayTitle, examReplayLimit: examLimit } = resolveClip(
    audioRef,
    title,
  );
  const labelId = useId();
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const [playsUsed, setPlaysUsed] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const startedThisPlay = useRef(false);

  const playsLeft = practiceMode ? Number.POSITIVE_INFINITY : Math.max(0, examLimit - playsUsed);
  const canStart = Boolean(src) && !loadError && (practiceMode || playsLeft > 0);

  const onPlayClick = useCallback(async () => {
    const el = audioEl.current;
    if (!el || !src) return;
    try {
      if (!el.paused) {
        el.pause();
        setPlaying(false);
        return;
      }
      if (!canStart && el.currentTime === 0) return;
      if (el.ended || el.currentTime === 0) {
        if (!practiceMode && playsUsed >= examLimit) return;
        if (!startedThisPlay.current || el.ended || el.currentTime === 0) {
          setPlaysUsed((n) => n + 1);
          startedThisPlay.current = true;
        }
        el.currentTime = 0;
      }
      await el.play();
      setPlaying(true);
    } catch {
      setLoadError(true);
      setPlaying(false);
    }
  }, [canStart, examLimit, practiceMode, playsUsed, src]);

  if (!src || loadError) {
    return (
      <div
        dir="rtl"
        className={cn(
          "mx-auto w-full max-w-[52rem] rounded-xl border border-dashed border-amber-300/80 bg-amber-50/50 px-4 py-3",
          className,
        )}
        role="status"
      >
        <p className="text-sm font-medium text-ink" id={labelId}>
          🎧 {displayTitle}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          קובץ השמע עדיין לא הועלה. בינתיים השתמשו בתמליל למטה —{" "}
          <strong className="font-medium text-ink">קראו פעם אחת</strong> (או שתיים לכל
          היותר), ואז ענו בלי לחזור לתמליל.
        </p>
        {clip?.suggestedFilename ? (
          <p className="mt-2 font-mono text-xs text-muted" dir="ltr">
            Drop file → public/amirant-listening/{clip.suggestedFilename}
          </p>
        ) : null}
      </div>
    );
  }

  const remainingLabel =
    playsLeft === Number.POSITIVE_INFINITY ? "∞" : String(playsLeft);

  return (
    <div
      dir="rtl"
      className={cn(
        "mx-auto w-full max-w-[52rem] rounded-xl border border-line/70 bg-surface-low/40 px-4 py-3 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink" id={labelId}>
            🎧 {displayTitle}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {practiceMode
              ? "מצב תרגול — אפשר להשמיע שוב"
              : `מצב מבחן — עד ${examLimit} השמע${examLimit === 1 ? "ה" : "ות"} (כמו בבחינה)`}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-sky-800 underline-offset-2 hover:underline"
          onClick={() => {
            setPracticeMode((v) => !v);
            startedThisPlay.current = false;
          }}
        >
          {practiceMode ? "חזרה למצב מבחן" : "מצב תרגול (השמעות נוספות)"}
        </button>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- listening drills; transcript sits below in lesson MD */}
      <audio
        ref={audioEl}
        src={src}
        preload="metadata"
        className="sr-only"
        aria-labelledby={labelId}
        onEnded={() => {
          setPlaying(false);
          startedThisPlay.current = false;
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => setLoadError(true)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPlayClick}
          disabled={!playing && !canStart}
          className={cn(
            "inline-flex h-10 min-w-[7.5rem] items-center justify-center rounded-lg px-4 text-sm font-medium transition",
            playing || canStart
              ? "bg-ink text-paper hover:bg-ink/90"
              : "cursor-not-allowed bg-line/60 text-muted",
          )}
        >
          {playing ? "השהה" : playsUsed === 0 ? "השמע" : "השמע שוב"}
        </button>
        {!practiceMode ? (
          <span className="text-xs text-muted">
            נותרו {remainingLabel} השמע
            {playsLeft === 1 ? "ה" : "ות"}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        הכינו דף ועט לפני ההשמעה. אל תפתחו את התמליל לפני שניסיתם לענות.
      </p>
    </div>
  );
}
