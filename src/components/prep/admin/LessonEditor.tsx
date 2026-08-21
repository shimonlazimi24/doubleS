"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminNotice,
  AdminSection,
  AdminSelect,
  AdminTextarea,
} from "./admin-ui";

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

/**
 * Modules come from the manifest, not a hand-written list. The old list used
 * values like "vocabulary" while the course modules are "mod-vocab", so a lesson
 * saved from here was attached to a module that does not exist.
 */
const TOPICS = [
  { value: "", label: "- בחר מודול -" },
  ...AMIRANT_PREPARATION_MANIFEST.modules.map((m) => ({ value: m.id, label: m.title })),
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

/** שיעורים עם חוויית צעדים "curated" - שינוי כותרות H2 עלול לשבור את סיווג הצעדים. */
const CURATED_LESSON_IDS = new Set(["lesson.intro.welcome", "lesson.intro.roadmap"]);

export function LessonEditor({
  initial,
  cmsExists = false,
}: {
  initial?: Partial<LessonFormData>;
  /** True only when a cms_lessons row already exists (not just a manifest id prefill). */
  cmsExists?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LessonFormData>({ ...EMPTY, ...initial });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isNew = !cmsExists;
  const isCurated = Boolean(form.id) && CURATED_LESSON_IDS.has(form.id);

  function set<K extends keyof LessonFormData>(key: K, value: LessonFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(mode: "keep" | "publish" | "unpublish") {
    setError(null);
    setSuccess(null);
    const payload = { ...form };
    if (mode === "publish") payload.published = true;
    if (mode === "unpublish") payload.published = false;
    // mode === "keep" → leave published as currently edited in form

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
        const data = await res.json();
        setForm((f) => ({ ...f, published: payload.published }));
        setSuccess(payload.published ? "נשמר ופורסם" : "נשמר");
        if (isNew && data.id) {
          router.push(`/prep/admin/lessons/${data.id}`);
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
      const res = await fetch(`/api/prep/admin/lessons/${form.id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "מחיקה נכשלה" }));
        setError(msg ?? "מחיקה נכשלה");
        return;
      }
      router.push("/prep/admin/lessons");
    });
  }

  return (
    <div className="max-w-5xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? "שיעור חדש" : "עריכת שיעור"}</h1>
          {!isNew && (
            <p className="mt-1 font-mono text-xs text-muted">
              {form.id}
              {" · "}
              <a
                href={`/prep/amirant/course/lesson/${form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                צפה באתר
              </a>
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isNew && (
            <button onClick={handleDelete} className="rounded-control border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
              מחק
            </button>
          )}
          <button
            onClick={() => handleSave("keep")}
            disabled={isPending}
            className="rounded-control border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary disabled:opacity-50"
          >
            שמור
          </button>
          {form.published && (
            <button
              onClick={() => {
                if (confirm("לבטל את הפרסום? השיעור יחזור לטיוטה.")) handleSave("unpublish");
              }}
              disabled={isPending}
              className="rounded-control border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
            >
              בטל פרסום
            </button>
          )}
          <button
            onClick={() => handleSave("publish")}
            disabled={isPending}
            className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {form.published ? "עדכן ופרסם" : "פרסם"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-surface border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-surface border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {isCurated && (
        <div className="mb-4 rounded-surface border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          לשיעור זה יש חוויית צעדים מובנית. שינוי כותרות (##) עלול לפרק את חלוקת הצעדים - עדיף לערוך את
          הטקסט בתוך הסעיפים בלי לשנות כותרות. אפשר גם לפרסם רק «וידאו לשיעור» ולהשאיר את התוכן ריק.
        </div>
      )}

      {/* Metadata row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">כותרת השיעור *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="למשל: מילים שכיחות - פעלים"
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          />
        </div>
        {isNew && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">מזהה (ID) *</label>
            <input
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              placeholder="lesson.vocab.10"
              dir="ltr"
              className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">מודול</label>
          <select
            value={form.module_id}
            onChange={(e) => set("module_id", e.target.value)}
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">סוג שיעור</label>
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as LessonFormData["kind"])}
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          >
            <option value="text">טקסט בלבד</option>
            <option value="video">סרטון בלבד</option>
            <option value="mixed">טקסט + סרטון</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">זמן משוער (דקות)</label>
          <input
            type="number"
            value={form.estimated_minutes}
            onChange={(e) => set("estimated_minutes", parseInt(e.target.value) || 10)}
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">סדר תצוגה</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {(form.kind === "video" || form.kind === "mixed") && (
        <div className="mb-6">
          <label className="mb-1 block text-xs font-medium text-muted">קישור סרטון (YouTube / URL)</label>
          <input
            value={form.video_url}
            onChange={(e) => set("video_url", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            dir="ltr"
            className="w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted transition focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {/* Markdown editor */}
      {(form.kind === "text" || form.kind === "mixed") && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="text-xs font-medium text-muted">תוכן השיעור (Markdown)</label>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {preview ? "עריכה" : "תצוגה מקדימה"}
            </button>
          </div>

          {preview ? (
            <div className="prose prose-sm min-h-96 max-w-none overflow-auto rounded-surface border border-line bg-paper p-5 text-ink">
              <MarkdownPreview source={form.body_markdown} />
            </div>
          ) : (
            <textarea
              value={form.body_markdown}
              onChange={(e) => set("body_markdown", e.target.value)}
              placeholder={"# כותרת השיעור\n\nתוכן בפורמט Markdown...\n\n## תת-כותרת\n\n- נקודה ראשונה\n- נקודה שנייה\n\n**טקסט מודגש** ו-*טקסט נטוי*"}
              // Course content is Hebrew with English examples inside it. A hard
              // LTR box scrambled every Hebrew line; "auto" lets each line take
              // its own direction from its first strong character.
              dir="auto"
              rows={28}
              className="w-full resize-y rounded-surface border border-line bg-paper px-4 py-4 font-mono text-sm leading-relaxed text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          )}
          <p className="mt-2 text-xs text-muted">
            תומך ב-Markdown מלא: כותרות, **מודגש**, *נטוי*, רשימות, טבלאות, קוד, ציטוטים
          </p>
        </div>
      )}
    </div>
  );
}

// Safe markdown preview — escape HTML first, then apply limited markdown.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function MarkdownPreview({ source }: { source: string }) {
  if (!source.trim()) return <p className="italic text-muted">אין תוכן להצגה</p>;
  const escaped = escapeHtml(source);
  const html = escaped
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
