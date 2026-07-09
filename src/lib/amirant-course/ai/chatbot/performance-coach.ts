import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiQuizSnapshot, AiUserStatsSnapshot } from "../retrieval";
import { loadAiQuizSnapshot, loadAiUserStatsSnapshot } from "../retrieval";
import { AMIRANT_TOPIC_LABEL_HE } from "../../topic-labels";
import type { AmirantBankTopicSlug } from "../../types/bank-question";

function pickWeakest(rollups: AiUserStatsSnapshot["topicRollups"]): { topic: string; acc: number; n: number } | null {
  type Row = (typeof rollups)[number];
  const scored: Array<Row & { acc: number }> = rollups
    .filter((r) => (r.totalAnswered ?? 0) >= 2)
    .map((r) => ({
      ...r,
      acc: (r.totalCorrect ?? 0) / Math.max(1, r.totalAnswered ?? 1),
    }));
  if (scored.length === 0) {
    const any = rollups[0];
    if (!any) return null;
    return {
      topic: any.topic,
      acc: (any.totalCorrect ?? 0) / Math.max(1, any.totalAnswered ?? 1),
      n: any.totalAnswered ?? 0,
    };
  }
  scored.sort((a, b) => a.acc - b.acc);
  const w = scored[0]!;
  return { topic: w.topic, acc: w.acc, n: w.totalAnswered ?? 0 };
}

/**
 * Short, grounded summary for performance / recommendation responses (no LLM).
 */
export function buildPerformanceCoachCopy(params: {
  userStats: AiUserStatsSnapshot;
  quizSnapshot: AiQuizSnapshot | null;
}): { text: string; usedStudentData: boolean; recommendedAction: string } {
  const { userStats, quizSnapshot } = params;
  const hasData =
    userStats.topicRollups.length > 0 ||
    userStats.adaptiveState.length > 0 ||
    quizSnapshot != null;
  if (!hasData) {
    return {
      text: "אין עדיין מספיק נתוני תרגול/מבחנים בחשבון כדי לנתח ביצועים. כשתשלים מבחן אדפטיבי או סימולציה, אוכל להצביע על נושאים חלשים ולחבר המלצות.",
      usedStudentData: false,
      recommendedAction: "התחל/י מבחן אדפטיבי או סט תרגול בקורס, ואז שאל/י שוב.",
    };
  }

  const weak = pickWeakest(userStats.topicRollups);
  const weakLabel = weak ? (AMIRANT_TOPIC_LABEL_HE[weak.topic as AmirantBankTopicSlug] ?? weak.topic) : "-";
  const lines: string[] = [];
  if (weak) {
    const pct = Math.round(weak.acc * 100);
    lines.push(
      `הנושא היחסית הכי חלש לפי התרגול: **${weakLabel}** (בערך ${pct}% הצלחה מ-${weak.n} תשובות; מספרים מקור: מערכת בלבד).`,
    );
  } else {
    lines.push("יש נתוני נושאים, אך עדיין לא מספיק שאלות בנישא אחד כדי לבחור חולשה ברורה.");
  }
  if (quizSnapshot?.weakTopics?.length) {
    const he = quizSnapshot.weakTopics.map((t) => AMIRANT_TOPIC_LABEL_HE[t as AmirantBankTopicSlug] ?? t);
    lines.push(`במבחן האחרון: חולשות שזוהו: ${he.join(", ")}.`);
  }
  if (quizSnapshot && quizSnapshot.scorePct != null) {
    lines.push(`ציון ניסיון אחרון (לפי מערכת): ${Math.round(quizSnapshot.scorePct)}%.`);
  }

  const rec =
    weak && weak.topic
      ? `המלצה: מבחן־מיקוד קצר ב־${weakLabel}, ואז חזרה לשיעור הכרוך בנושא.`
      : "המלצה: בחר/י שיעור ממודול שבו מרגישים פחות בטחון, והשלים/י מבחן אדפטיבי קצר.";

  return {
    text: lines.join("\n"),
    usedStudentData: true,
    recommendedAction: rec,
  };
}

export async function loadPerformanceCoachInputs(
  client: SupabaseClient,
  userId: string,
): Promise<{
  userStats: AiUserStatsSnapshot;
  quizSnapshot: AiQuizSnapshot | null;
}> {
  const [userStats, quizSnapshot] = await Promise.all([
    loadAiUserStatsSnapshot(client, userId),
    loadAiQuizSnapshot(client, userId),
  ]);
  return { userStats, quizSnapshot };
}

export function buildPerformanceUserPromptForAi(userMessage: string, base: string, recommendedAction: string): string {
  return [
    "Task: give a VERY short, actionable performance summary in Hebrew (unless the user wrote in English).",
    "Start with the weakest area and why it matters for the exam, then one concrete next step (quiz / lesson / simulation) - do not invent numbers not in the data block.",
    'End with a line: "מה לעשות עכשיו:" and one line.',
    "",
    `User message: ${userMessage}`,
    "",
    "Data (ground truth; do not add facts):",
    base,
    "",
    `Suggested next action (you may rephrase, not replace with fantasy): ${recommendedAction}`,
  ].join("\n");
}
