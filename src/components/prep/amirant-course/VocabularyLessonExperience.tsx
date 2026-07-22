"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabParseResult } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import type { VocabularyLevel } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { buildVocabularyLessonModel, wordsToFlashPairs } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { VocabularyLessonShell } from "./vocabulary-premium/VocabularyLessonShell";

type TabId = "read" | "flash" | "memory";

const LEVEL_HE: Record<VocabularyLevel, string> = {
  easy: "קל",
  intermediate: "בינוני",
  advanced: "מתקדמים",
  expert: "מומחה",
};

type FlashPair = { word: string; translation: string; id: number };

function shuffleInPlace<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function FlashPanel({ pairs }: { pairs: FlashPair[] }) {
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const [round, setRound] = useState(0);

  const deck = useMemo(() => {
    if (pairs.length === 0) return pairs;
    return shuffleInPlace([...pairs]);
  }, [pairs, round]);

  useEffect(() => {
    setI(0);
    setBack(false);
  }, [pairs, round]);

  const e = deck[i] ?? null;

  const next = useCallback(() => {
    setBack(false);
    setI((x) => (x + 1) % Math.max(1, deck.length));
  }, [deck.length]);
  const prev = useCallback(() => {
    setBack(false);
    setI((x) => (x - 1 + deck.length) % Math.max(1, deck.length));
  }, [deck.length]);

  const reshuffle = useCallback(() => {
    setRound((r) => r + 1);
  }, []);

  if (!e) {
    return <p className="text-sm text-slate-500">אין מספיק מילים.</p>;
  }
  return (
    <div className="space-y-4">
      <div
        className="relative min-h-[220px] cursor-pointer select-none rounded-2xl border-2 border-sky-200/50 bg-gradient-to-b from-stone-50/80 to-white p-6 shadow-[0_1px_2px_rgba(15,35,71,0.06)] sm:min-h-[280px] sm:p-8"
        dir={back ? "rtl" : "ltr"}
        lang={back ? "he" : "en"}
        onClick={() => setBack((b) => !b)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            setBack((b) => !b);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="לחיצה להפיכת הכרטיס"
      >
        <Text as="p" variant="caption" className="text-center text-sky-800">
          {back ? "עברית (תרגום)" : "English"}
        </Text>
        <p
          className={cn("mt-6 text-center text-2xl font-bold leading-snug sm:text-3xl", !back && "font-serif", back && "text-[#0f2347]")}
        >
          {back ? e.translation : e.word}
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">הקליקו על הכרטיס להחלפת צד</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <Button variant="ghost" onClick={prev} disabled={deck.length < 2} type="button">
          הקודם
        </Button>
        <Button
          variant="secondary"
          onClick={next}
          className="min-w-[4rem] font-mono"
          disabled={deck.length < 2}
        >
          {i + 1} / {deck.length}
        </Button>
        <Button variant="ghost" onClick={next} disabled={deck.length < 2} type="button">
          הבא
        </Button>
        <Button variant="ghost" onClick={reshuffle} type="button" title="לערוך שוב">
          ↻
        </Button>
      </div>
    </div>
  );
}

type MemCard = { uid: string; n: number; kind: "en" | "he"; text: string; face: boolean; matched: boolean };

function buildMemoryGame(pairs: FlashPair[], pairCount: 4 | 6 | 8) {
  const use = pairs.filter((e) => e.translation !== "-" && e.word !== "-" && e.word.length > 0);
  const nPick = Math.min(Math.min(pairCount, 8), Math.max(0, use.length));
  if (nPick < 1) return [] as MemCard[];
  const sh = shuffleInPlace([...use]).slice(0, nPick);
  const cards: MemCard[] = [];
  const idSuffix = String(Math.random()).slice(2, 8);
  for (const e of sh) {
    const base = `m-${e.id}-${idSuffix}`;
    cards.push(
      { uid: `${base}-e`, n: e.id, kind: "en", text: e.word, face: false, matched: false },
      { uid: `${base}-h`, n: e.id, kind: "he", text: e.translation, face: false, matched: false },
    );
  }
  return shuffleInPlace(cards);
}

function MemoryPanel({ pairs }: { pairs: FlashPair[] }) {
  const [pairCount, setPairCount] = useState<4 | 6 | 8>(4);
  const [deal, setDeal] = useState(0);
  const [cards, setCards] = useState<MemCard[]>(() => buildMemoryGame(pairs, 4));
  const [one, setOne] = useState<MemCard | null>(null);
  const [lock, setLock] = useState(false);

  useEffect(() => {
    setCards(buildMemoryGame(pairs, pairCount));
    setOne(null);
    setLock(false);
  }, [pairs, pairCount, deal]);

  const redeal = useCallback((c: 4 | 6 | 8) => {
    setPairCount(c);
  }, []);

  const onPick = useCallback(
    (c: MemCard) => {
      if (c.matched || lock) return;
      if (one && c.uid === one.uid) {
        setOne(null);
        setCards((prev) => prev.map((x) => (x.uid === c.uid ? { ...x, face: false } : x)));
        return;
      }
      if (c.face) return;
      if (!one) {
        setOne(c);
        setCards((prev) => prev.map((x) => (x.uid === c.uid ? { ...x, face: true } : x)));
        return;
      }
      setCards((prev) => prev.map((x) => (x.uid === c.uid ? { ...x, face: true } : x)));
      if (one.n === c.n && one.kind !== c.kind) {
        setLock(true);
        window.setTimeout(() => {
          setCards((prev) => prev.map((x) => (x.n === c.n ? { ...x, matched: true, face: true } : x)));
          setOne(null);
          setLock(false);
        }, 400);
        return;
      }
      setLock(true);
      const aUid = one.uid;
      const bUid = c.uid;
      window.setTimeout(() => {
        setCards((prev) => prev.map((x) => (x.uid === aUid || x.uid === bUid ? { ...x, face: false } : x)));
        setOne(null);
        setLock(false);
      }, 800);
    },
    [lock, one],
  );

  const allMatched = useMemo(
    () => (cards.length > 0 && cards.every((c) => c.matched) ? true : false),
    [cards],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Text as="span" variant="caption" className="me-1 text-slate-500">
          זוגות
        </Text>
        {([4, 6, 8] as const).map((n) => (
          <Button key={n} variant={pairCount === n ? "primary" : "ghost"} onClick={() => redeal(n)} className="!px-2 !py-1.5 text-xs">
            {n}
          </Button>
        ))}
        <Button variant="secondary" onClick={() => setDeal((d) => d + 1)} className="ms-2" type="button">
          לערוך שוב
        </Button>
      </div>
      {cards.length === 0 ? <p className="text-sm text-slate-500">אין מספיק מילים עם תרגום (נדרש לפחות 1 שורה תרגום).</p> : null}
      {allMatched && cards.length > 0 ? (
        <p className="text-center text-sm font-semibold text-sky-800">יופי! סיימתם את הלוח.</p>
      ) : null}
      {cards.length > 0 ? (
        <ul className="grid [grid-template-columns:repeat(auto-fill,minmax(5.5rem,1fr))] gap-2 sm:gap-3" dir="rtl">
          {cards.map((c) => {
            const show = c.matched || c.face;
            return (
              <li key={c.uid} className="min-h-0 [list-style:none]">
                <button
                  type="button"
                  disabled={c.matched || lock}
                  onClick={() => onPick(c)}
                  className={cn(
                    "flex h-24 w-full min-w-0 items-center justify-center rounded-xl border-2 p-1.5 text-sm font-medium shadow-sm transition sm:h-28",
                    c.matched && "border-emerald-400/60 bg-emerald-50/50 text-emerald-900",
                    !c.matched && show && c.kind === "en" && "border-sky-300/50 bg-sky-50/80 text-[#0f2347]",
                    !c.matched && show && c.kind === "he" && "border-violet-300/50 bg-violet-50/80 text-[#0f2347]",
                    !show && "border-stone-200/80 bg-stone-50/50 text-transparent hover:text-slate-400/50",
                  )}
                >
                  <span
                    className={cn(
                      "line-clamp-3 text-center [overflow-wrap:anywhere]",
                      show ? "text-[#0f2347]" : "",
                      c.kind === "en" && "font-mono [direction:ltr] [text-align:left]",
                    )}
                    dir={c.kind === "en" ? "ltr" : "rtl"}
                    translate={c.kind === "he" ? "yes" : "no"}
                  >
                    {show ? c.text : "?"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export type VocabularyLessonExperienceProps = {
  data: VocabParseResult;
  lessonId: string;
  title: string;
  estimatedMinutes: number | null;
};

export function VocabularyLessonExperience({ data, lessonId, title, estimatedMinutes }: VocabularyLessonExperienceProps) {
  const [tab, setTab] = useState<TabId>("read");

  const model = useMemo(() => buildVocabularyLessonModel(lessonId, data, { lessonTitle: title }), [lessonId, data, title]);

  const flashPairs = useMemo(
    () =>
      wordsToFlashPairs(model.words).map((p) => ({
        word: p.word,
        translation: p.translation,
        id: p.n,
      })),
    [model.words],
  );

  const hasVocab = data.allEntries.length > 0;
  if (!hasVocab) {
    return null;
  }

  const metaLine = [
    `רמה: ${LEVEL_HE[model.level]}`,
    `${model.wordCount} מילים`,
    estimatedMinutes != null ? `~${estimatedMinutes} דק׳` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-2 space-y-4 [direction:rtl]">
      <div className="space-y-2">
        {/* בורר מצב קומפקטי - בלי כרטיס עוטף (DESIGN_GUIDELINES: אין קופסה בלי תפקיד) */}
        <div className="inline-flex items-center rounded-full bg-stone-100/80 p-1" role="group" aria-label="אופן התרגול">
          {(
            [
              { id: "read" as const, label: "למידה" },
              { id: "flash" as const, label: "כרטיסיות" },
              { id: "memory" as const, label: "התאמות" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-semibold transition",
                tab === t.id ? "bg-[#0f2347] text-white shadow-sm" : "text-slate-600 hover:text-[#0f2347]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{metaLine}</p>
      </div>

      {tab === "read" ? <VocabularyLessonShell model={model} /> : null}
      {tab === "flash" ? (
        <Card className="border-stone-200/85" padding="none">
          <CardBody className="space-y-2 p-4 sm:p-6">
            <CardTitle>
              <Heading level={2} className="text-base sm:text-lg">
                כרטיסיות - English ⟷ עברית
              </Heading>
            </CardTitle>
            <Text as="p" variant="bodySm" className="text-slate-500">
              אנגלית בחזית, תרגום בגב (לחצו לסיבוב)
            </Text>
            <FlashPanel pairs={flashPairs} />
          </CardBody>
        </Card>
      ) : null}
      {tab === "memory" ? (
        <Card className="border-stone-200/85" padding="none">
          <CardBody className="space-y-2 p-4 sm:p-6">
            <CardTitle>
              <Heading level={2} className="text-base sm:text-lg">
                לוח התאמות
              </Heading>
            </CardTitle>
            <Text as="p" variant="bodySm" className="text-slate-500">
              חפשו שני אזורים: מילה באנגלית ואת התרגום שלה. לחצו בזוגות.
            </Text>
            <MemoryPanel pairs={flashPairs} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
