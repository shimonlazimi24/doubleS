import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { decodeState, encodeState } from "@/lib/amirant-course/simulations/adaptive/state.server";
import { answerSingle, buildReport, startAttempt, submitSet, submitWritingText, timeOut, type StepOutcome } from "@/lib/amirant-course/simulations/adaptive/run.server";
import { getAdaptiveAttemptStore } from "@/lib/amirant-course/simulations/adaptive/attempts.server";
import { poolIsAvailable, poolWaveIds, poolWritingItem } from "@/lib/amirant-course/simulations/adaptive/pool.server";
import { gradeEssay } from "@/lib/amirant-course/writing/grade-essay.server";
import { countWords } from "@/lib/amirant-course/writing/types";
import type { WritingOutcome } from "@/lib/amirant-course/simulations/adaptive/types";

/** The essay is graded inside the finishing request. */
export const maxDuration = 60;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), startLevel: z.number().int().min(1).max(6).optional() }),
  z.object({ action: z.literal("answer"), token: z.string().min(10), questionId: z.string().min(1).max(120), answer: z.string().max(80) }),
  z.object({ action: z.literal("submitSet"), token: z.string().min(10), answers: z.record(z.string().max(120), z.string().max(40).nullable()) }),
  z.object({ action: z.literal("submitWriting"), token: z.string().min(10), text: z.string().max(4000) }),
  z.object({ action: z.literal("timeout"), token: z.string().min(10), answers: z.record(z.string().max(120), z.string().max(40).nullable()).optional() }),
]);

/**
 * The adaptive simulation, one step per request. The state rides in a signed
 * token; the keys stay here. Full access only: the pool is the paid product.
 */
export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId && !getPrepHasFullAccess()) {
    return NextResponse.json({ error: "יש להתחבר כדי להתחיל סימולציה." }, { status: 401 });
  }
  const rateKey = userId ? `u:${userId}` : `i:${requestIp}`;
  if (!(await checkAiRouteRateLimit({ key: rateKey, route: "adaptive-sim", maxRequests: 120, windowMs: 60_000 }))) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }
  if (!(await hasAmirantFullAccess(client, userId))) {
    return NextResponse.json({ error: "הסימולציה זמינה בגישה המלאה לקורס." }, { status: 403 });
  }
  if (!poolIsAvailable()) {
    return NextResponse.json({ error: "מאגר הסימולציות עדיין לא נטען." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const body = parsed.data;

  const { store, userKey, persistent } = getAdaptiveAttemptStore(client, userId);

  try {
    if (body.action === "start") {
      const priorUsed = await store.usedIds();
      const simId = poolWaveIds().join("+");
      const attemptId = await store.startAttempt(body.startLevel ?? 4).catch(() => null);
      const out = startAttempt({ userKey, simId, attemptId, priorUsed, startLevel: body.startLevel });
      return NextResponse.json({ token: encodeState(out.state), section: out.section, persistent });
    }

    const state = decodeState(body.token);
    if (!state || state.userKey !== userKey) return NextResponse.json({ error: "הסימולציה פגה. התחילו מחדש." }, { status: 409 });
    if (state.finished) return NextResponse.json({ error: "הסימולציה כבר הסתיימה." }, { status: 409 });

    let out: StepOutcome;
    if (body.action === "answer") out = answerSingle(state, body.questionId, body.answer);
    else if (body.action === "submitSet") out = submitSet(state, body.answers);
    else if (body.action === "submitWriting") out = submitWritingText(state, body.text);
    else out = timeOut(state, body.answers ?? {});

    if (out.closedSection) {
      await store.recordSection(out.state.attemptId, out.closedSection, out.state.used, []).catch(() => undefined);
    }

    if (!out.state.finished) {
      return NextResponse.json({ token: encodeState(out.state), section: out.section, lastCorrect: out.lastCorrect ?? null, closedSection: out.closedSection ?? null });
    }

    // Finished: grade the essay if there is one, build the report, persist.
    let writing: WritingOutcome | null = null;
    if (out.state.writing && out.state.writing.text.trim()) {
      const item = poolWritingItem(out.state.writing.taskId);
      if (item) {
        try {
          const task = {
            id: item.taskId!,
            n: 0,
            prompt: item.prompt!,
            wordRange: item.wordRange ?? ([90, 120] as [number, number]),
            minutes: 12,
            method: [],
            usefulPhrases: [],
            words: [],
            rubric: {
              content: {
                low: "התשובה לא עונה על השאלה, או שהעמדה לא ברורה, או שהסיבות מופיעות כרשימה בלי הסבר, או שאין משפט סיכום, או שהתשובה קצרה מ-90 מילים.",
                mid: "העמדה ברורה ויש שתי סיבות, אבל הן רק נאמרות, בלי דוגמה מהחיים או פרט מוחשי. מילות הקישור בסיסיות וחוזרות על עצמן.",
                high: item.rubricHigh?.content ?? "",
              },
              language: {
                low: "טעויות רבות שמקשות על הקריאה: התאמה בין נושא לפועל, צורות עבר שגויות, סדר מילים עברי ומיליות חסרות. אוצר המילים בסיסי מאוד.",
                mid: "המשמעות ברורה, אבל יש כמה טעויות חוזרות. אוצר המילים פשוט, מעט משפטים מורכבים.",
                high: item.rubricHigh?.language ?? "",
              },
            },
            samples: item.highModel
              ? [{ level: "high" as const, statedWords: countWords(item.highModel), essay: item.highModel, analysisHe: "", analysisEn: "" }]
              : [],
          };
          const g = await gradeEssay(task, out.state.writing.text);
          writing = {
            taskId: item.taskId!,
            wordCount: g.wordCount,
            content: g.content.level,
            language: g.language.level,
            whyContentHe: g.content.whyHe,
            whyLanguageHe: g.language.whyHe,
            workedHe: g.workedHe,
            fixHe: g.fixHe,
          };
        } catch {
          writing = null;
        }
      }
    }
    const report = buildReport(out.state, writing);
    await store.finishAttempt(report, out.state.used).catch(() => undefined);
    return NextResponse.json({ token: null, section: null, report, closedSection: out.closedSection ?? null, persistent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: message === "answer out of order" ? "התשובה לא תואמת את השאלה הנוכחית. רעננו את הדף." : "הפעולה נכשלה. נסו שוב." }, { status: 400 });
  }
}
