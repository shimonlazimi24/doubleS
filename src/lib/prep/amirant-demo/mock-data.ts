/** נתוני דמו בלבד - הכנה למבחן אמירנט (מוק לפלטפורמה). */

export const AMIRANT_DEMO_COURSE_NAME = "אמירנט - קורס הכנה (סילבוס + מבחן מערכת)";

export const mockDashboardStats = [
  { label: "התקדמות במסלול", value: "38%", hint: "יחידה 2 מתוך 5 (דמו)" },
  { label: "מבחני דמה הושלמו", value: "2 / 6", hint: "המלצה: מבחן מלא הבא" },
  { label: "ממוצע מיומנויות", value: "72%", hint: "דקדוק · אוצר מילים · הבנה" },
  { label: "זמן למידה (שבוע)", value: "3.2 שע׳", hint: "לפי אירועי דמו" },
] as const;

export const mockVideoMeta = {
  title: "יחידה 2 · דקדוק ומבנה משפט",
  durationLabel: "12:40",
  durationSec: 760,
  chapters: [
    { startSec: 0, label: "פתיחה" },
    { startSec: 120, label: "זמנים באנגלית" },
    { startSec: 300, label: "תרגול מהיר" },
    { startSec: 540, label: "סיכום" },
  ],
  /** שאלת אינטראקציה באמצע הווידאו (מוק) */
  interaction: {
    atSec: 185,
    question: "בחרו את המשפט הנכון לפי הכלל שנלמד:",
    options: [
      "I have been studying since two years.",
      "I have been studying for two years.",
      "I study since two years.",
    ],
    correctIndex: 1,
  },
} as const;

export const mockQuiz = {
  title: "בוחן דמה - אנגלית ודקדוק (אמירנט)",
  questions: [
    {
      id: "q1",
      prompt: "מה התרגום המתאים למילה «nevertheless» בהקשר אקדמי?",
      options: ["למרות זאת", "בנוסף", "לכן", "לעומת זאת"],
      correctIndex: 0,
      skill: "אוצר מילים",
    },
    {
      id: "q2",
      prompt: "איזו משפט נכון דקדוקית?",
      options: [
        "She suggested me to apply earlier.",
        "She suggested that I apply earlier.",
        "She suggested me applying earlier.",
        "She suggested I to apply earlier.",
      ],
      correctIndex: 1,
      skill: "דקדוק",
    },
    {
      id: "q3",
      prompt: "בטקסט קצר: המטרה העיקרית של הפסקה היא -",
      options: [
        "להציג נתונים גולמיים בלבד",
        "לפתח טיעון מרכזי אחד עם דוגמאות",
        "לסכם את כל המאמר בלי קשר לכותרת",
        "להעתיק מהמקור",
      ],
      correctIndex: 1,
      skill: "הבנה והסקה",
    },
  ],
} as const;

export const mockAiAnalysis = {
  generatedAt: "2026-04-12T14:30:00",
  summary:
    "ביצועים טובים באוצר מילים; פער משמעותי בדקדוק מורכב (משפטים מקוננים). מומלץ לחזור על Present Perfect מול Past Simple.",
  strengths: ["אוצר מילים אקדמי בסיסי", "קריאה מהירה יחסית"],
  gaps: ["התאמת זמנים בהקשר ארוך", "שאלות Truth Value בזמן לחץ"],
  nextSteps: [
    "תרגול ממוקד: 15 שאלות Present Perfect (יומיים)",
    "מבחן דמה קצר - 20 דק׳ - בעוד 3 ימים",
  ],
  modelLabel: "דמו: שכבת AI (ללא קריאה חיצונית)",
} as const;

export const mockBehaviorReport = {
  title: "דוח התנהגות - 14 יום אחרונים (דמו)",
  rows: [
    { event: "צפייה בווידאו - יחידה 2", count: 4, avgMinutes: 8.2 },
    { event: "התחלת בוחן דמה", count: 3, avgMinutes: null },
    { event: "השלמת בוחן", count: 2, avgMinutes: 24 },
    { event: "הודעות צ׳אט (דמו)", count: 12, avgMinutes: null },
    { event: "חזרה לשיעור קודם", count: 1, avgMinutes: null },
  ],
} as const;

export const mockProgressSeries = [
  { label: "שב׳ 1", score: 58 },
  { label: "שב׳ 2", score: 64 },
  { label: "שב׳ 3", score: 71 },
  { label: "שב׳ 4", score: 72 },
] as const;

export const mockIntegrations = [
  { name: "יומן (ICS / Google)", status: "מוכן לחיבור", detail: "ייצוא מועדי מבחני דמה" },
  { name: "תשלומים (Stripe)", status: "מוכן לחיבור", detail: "רישום למסלול" },
  { name: "Webhooks", status: "מוכן לחיבור", detail: "אירועים: attempt_submitted" },
  { name: "SSO (OIDC)", status: "אופציונלי", detail: "ארגונים" },
] as const;

/** תשובות צ׳אט דמו - לפי מילות מפתח (ללא שרת). */
export function getMockChatReply(userMessage: string): string {
  const t = userMessage.trim().toLowerCase();
  if (!t) return "כתבו שאלה על המבנה, הדקדוק או אסטרטגיית זמן - זו תשובת דמו.";
  if (/אמירנט|מבחן|משך|זמן/.test(t)) {
    return "בדמו: המבחן בודק אנגלית ברמה אקדמית. מומלץ לתרגל בלוקים של 45 דק׳ ולהדמות מבחן מלא פעם בשבוע.";
  }
  if (/דקדוק|grammar|זמנים|tense/.test(t)) {
    return "בדמו: נשמור טעויות נפוצות ב-Present Perfect ומילות קישור. בשלב הבא נחבר ניתוח אישי לפי תשובותיך.";
  }
  if (/אוצר|מילים|vocab/.test(t)) {
    return "בדמו: בונים אוצר אקדמי מרשימות שמקושרות לטקסטים בקורס - לא רשימות מבודדות.";
  }
  if (/הבנה|קריאה|reading/.test(t)) {
    return "בדמו: קראו את הפסקה פעמיים - פעם ראשונה גלובלית, פעם שנייה עם שאלות בראש.";
  }
  if (/ציון|ציונים|תוצאה/.test(t)) {
    return "בדמו: הציון המוצג כאן הוא מדומה. בפרודקשן הציון יגיע ממנוע ההערכה + אימות.";
  }
  return "תודה על השאלה. זוהי תשובת דמו מהבוט; בפרודקשן יתווספו מקורות מהחומר שלך (RAG) ומדיניות בטיחות.";
}
