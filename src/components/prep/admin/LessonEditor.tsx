"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type LessonFormData = {
  id: string;
  title: string;
  kind: "text" | "video" | "mixed";
  module_id: string;
  body_markdown: string;
  video_url: string;
  estimated_minutes: number;
  sort_order: number;
  published: boolean;
};

const TOPICS = [
  { value: "", label: "— בחר מודול —" },
  { value: "intro", label: "מבוא" },
  { value: "vocabulary", label: "אוצר מילים (Vocabulary)" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "rephrasing", label: "Restatement / Rephrasing" },
  { value: "reading_comprehension", label: "Reading Comprehension" },
  { value: "listening", label: "Listening (2026)" },
  { value: "simulations", label: "סימולציות" },
  { value: "tips", label: "טיפים ואסטרטגיות" },
  { value: "summary", label: "סיכום הקורס" },
];

const EMPTY: LessonFormData = {
  id: "",
  title: "",
  kind: "text",
  module_id: "",
  body_markdown: "",
  video_url: "",
  estimated_minutes: 10,
  sort_order: 0,
  published: false,
};

/** שיעורים עם חוויית צעדים "curated" — שינוי כותרות H2 עלול לשבור את סיווג הצעדים. */
const CURATED_LESSON_IDS = new Set(["lesson.intro.welcome", "lesson.intro.roadmap"]);

export function LessonEditor({ initial }: { initial?: Partial<LessonFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<LessonFormData>({ ...EMPTY, ...initial });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isNew = !initial?.id;
  const isCurated = !isNew && CURATED_LESSON_IDS.has(form.id);

  function set<K extends keyof LessonFormData>(key: K, value: LessonFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(publish?: boolean) {
    setError(null);
    const payload = { ...form };
    if (publish !== undefined) payload.published = publish;

    const url = isNew ? "/api/prep/admin/lessons" : `/api/prep/admin/lessons/${form.id}`;
    const method = isNew ? "POST" : "PATCH";

    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: "שגיאה לא ידועה" }));
          setError(msg ?? "שגיאה");
          return;
        }
        const { id } = await res.json();
        if (isNew && id) {
          router.push(`/prep/admin/lessons/${id}`);
        } else {
          router.refresh();
        }
      } catch {
        setError("שגיאת רשת");
      }
    });
  }

  async function handleDelete() {
    if (!confirm("למחוק את השיעור לצמיתות?")) return;
    startTransition(async () => {
      await fetch(`/api/prep/admin/lessons/${form.id}`, { method: "DELETE" });
      router.push("/prep/admin/lessons");
    });
  }

  return (
    <div className="max-w-5xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? "שיעור חדש" : "עריכת שיעור"}</h1>
          {!isNew && (
            <p className="text-zinc-500 text-xs mt-1 font-mono">
              {form.id}
              {" · "}
              <a
                href={`/prep/amirant/course/lesson/${form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                צפה באתר ↗
              </a>
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isNew && (
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-900 rounded-lg">
              מחק
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition disabled:opacity-50"
          >
            שמור טיוטה
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {form.published ? "עדכן ופרסם" : "פרסם"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {isCurated && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/40 rounded-lg text-sm text-amber-900">
          ⚠️ לשיעור זה יש חוויית צעדים מובנית. שינוי כותרות (##) עלול לפרק את חלוקת הצעדים — עדיף לערוך את
          הטקסט בתוך הסעיפים בלי לשנות כותרות. אפשר גם לפרסם רק «וידאו לשיעור» ולהשאיר את התוכן ריק.
        </div>
      )}

      {/* Metadata row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-2">
          <label className="block text-xs text-zinc-400 mb-1">כותרת השיעור *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="למשל: מילים שכיחות — פעלים"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        {isNew && (
          <div>
            <label className="block text-xs text-zinc-400 mb-1">מזהה (ID) *</label>
            <input
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              placeholder="lesson.vocab.10"
              dir="ltr"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">מודול</label>
          <select
            value={form.module_id}
            onChange={(e) => set("module_id", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">סוג שיעור</label>
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as LessonFormData["kind"])}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="text">📝 טקסט בלבד</option>
            <option value="video">🎬 סרטון בלבד</option>
            <option value="mixed">📝🎬 טקסט + סרטון</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">זמן משוער (דקות)</label>
          <input
            type="number"
            value={form.estimated_minutes}
            onChange={(e) => set("estimated_minutes", parseInt(e.target.value) || 10)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">סדר תצוגה</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {(form.kind === "video" || form.kind === "mixed") && (
        <div className="mb-6">
          <label className="block text-xs text-zinc-400 mb-1">קישור סרטון (YouTube / URL)</label>
          <input
            value={form.video_url}
            onChange={(e) => set("video_url", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            dir="ltr"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Markdown editor */}
      {(form.kind === "text" || form.kind === "mixed") && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="text-xs text-zinc-400">תוכן השיעור (Markdown)</label>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="text-xs text-blue-400 hover:underline"
            >
              {preview ? "עריכה" : "תצוגה מקדימה"}
            </button>
          </div>

          {preview ? (
            <div className="min-h-96 bg-zinc-900 border border-zinc-700 rounded-xl p-5 prose prose-invert prose-sm max-w-none overflow-auto">
              <MarkdownPreview source={form.body_markdown} />
            </div>
          ) : (
            <textarea
              value={form.body_markdown}
              onChange={(e) => set("body_markdown", e.target.value)}
              placeholder={"# כותרת השיעור\n\nתוכן בפורמט Markdown...\n\n## תת-כותרת\n\n- נקודה ראשונה\n- נקודה שנייה\n\n**טקסט מודגש** ו-*טקסט נטוי*"}
              dir="ltr"
              rows={28}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
            />
          )}
          <p className="text-xs text-zinc-600 mt-2">
            תומך ב-Markdown מלא: כותרות, **מודגש**, *נטוי*, רשימות, טבלאות, קוד, ציטוטים
          </p>
        </div>
      )}
    </div>
  );
}

// Simple markdown preview — renders as HTML
function MarkdownPreview({ source }: { source: string }) {
  if (!source.trim()) return <p className="text-zinc-500 italic">אין תוכן להצגה</p>;
  // Basic markdown rendering without external dependency
  const html = source
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
