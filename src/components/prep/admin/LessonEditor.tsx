"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import { bodyToSave } from "@/lib/prep/admin/lesson-body";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
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
const MODULES = AMIRANT_PREPARATION_MANIFEST.modules.map((m) => ({ value: m.id, label: m.title }));

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

/** Lessons with a curated step flow: renaming their H2 headings can break the step split. */
const CURATED_LESSON_IDS = new Set(["lesson.intro.welcome", "lesson.intro.roadmap"]);

export function LessonEditor({
  initial,
  cmsExists = false,
  orphan = false,
  staticMarkdown = "",
}: {
  initial?: Partial<LessonFormData>;
  /** True only when a cms_lessons row already exists (not just a manifest prefill). */
  cmsExists?: boolean;
  /** A CMS row whose id is no longer in the course: learners cannot reach it. */
  orphan?: boolean;
  /** The lesson's text from the course files, to tell an edit from an untouched prefill. */
  staticMarkdown?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LessonFormData>({ ...EMPTY, ...initial });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCurated = CURATED_LESSON_IDS.has(form.id);
  const showsText = form.kind === "text" || form.kind === "mixed";
  const showsVideo = form.kind === "video" || form.kind === "mixed";
  const usesCourseText = Boolean(staticMarkdown.trim()) && !bodyToSave(form.body_markdown, staticMarkdown);

  function set<K extends keyof LessonFormData>(key: K, value: LessonFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(null);
  }

  function handleSave(mode: "keep" | "publish" | "unpublish") {
    setError(null);
    setSuccess(null);
    const published = mode === "publish" ? true : mode === "unpublish" ? false : form.published;
    const payload = {
      ...form,
      published,
      body_markdown: showsText ? bodyToSave(form.body_markdown, staticMarkdown) : "",
      video_url: showsVideo ? form.video_url : "",
    };

    startTransition(async () => {
      try {
        // PATCH upserts, so the first save and every later one take the same path.
        const res = await fetch(`/api/prep/admin/lessons/${encodeURIComponent(form.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? `השמירה נכשלה (${res.status})`);
          return;
        }
        setForm((f) => ({ ...f, published }));
        setSuccess(published ? "נשמר ופורסם. התלמידים רואים את הגרסה הזו." : "נשמר כטיוטה. התלמידים עדיין רואים את קבצי הקורס.");
        if (!cmsExists) {
          router.replace(`/prep/admin/lessons/${encodeURIComponent(form.id)}`);
        } else {
          router.refresh();
        }
      } catch {
        setError("שגיאת רשת. השינויים לא נשמרו.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("למחוק את הגרסה הערוכה? השיעור יחזור לתוכן מקבצי הקורס. אי אפשר לבטל.")) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/prep/admin/lessons/${encodeURIComponent(form.id)}`, { method: "DELETE" });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "המחיקה נכשלה");
          return;
        }
        router.push("/prep/admin/lessons");
        router.refresh();
      } catch {
        setError("שגיאת רשת. הגרסה הערוכה לא נמחקה.");
      }
    });
  }

  const status = !cmsExists ? "בלי עריכה" : form.published ? "פורסם" : "טיוטה";

  return (
    <div className="max-w-5xl space-y-6" dir="rtl">
      <AdminPageHeader
        title={form.title || "עריכת שיעור"}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3">
            <span dir="ltr" className="font-mono text-xs">
              {form.id}
            </span>
            <span>{status}</span>
            {!orphan ? (
              <a
                href={`/prep/amirant/course/lesson/${encodeURIComponent(form.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline"
              >
                לשיעור באתר
              </a>
            ) : null}
          </span>
        }
        actions={
          <>
            {cmsExists ? (
              <AdminButton tone="danger" onClick={handleDelete} disabled={isPending}>
                מחיקת העריכה
              </AdminButton>
            ) : null}
            {form.published ? (
              <AdminButton
                onClick={() => {
                  if (confirm("לבטל את הפרסום? התלמידים יחזרו לראות את התוכן מקבצי הקורס.")) handleSave("unpublish");
                }}
                disabled={isPending}
              >
                ביטול פרסום
              </AdminButton>
            ) : (
              <AdminButton onClick={() => handleSave("keep")} disabled={isPending || orphan}>
                שמירת טיוטה
              </AdminButton>
            )}
            <AdminButton tone="primary" onClick={() => handleSave("publish")} disabled={isPending || orphan}>
              {isPending ? "שומר…" : form.published ? "שמירה ופרסום" : "פרסום"}
            </AdminButton>
          </>
        }
      />

      <div aria-live="polite" className="space-y-3 empty:hidden">
        {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
        {success ? <AdminNotice tone="success">{success}</AdminNotice> : null}
      </div>

      {orphan ? (
        <AdminNotice tone="warning">
          המזהה הזה כבר לא קיים בקורס, ולכן אף תלמיד לא יכול להגיע לשיעור. אפשר רק למחוק את הרשומה.
        </AdminNotice>
      ) : null}

      {isCurated ? (
        <AdminNotice tone="warning">
          לשיעור הזה יש חלוקה מובנית לצעדים לפי כותרות ##. שינוי כותרת עלול לפרק את הצעדים; ערכו את הטקסט
          שבתוך הסעיפים. אפשר גם לבחור «סרטון בלבד» ולהשאיר את הטקסט מקבצי הקורס.
        </AdminNotice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminField label="כותרת השיעור" required className="sm:col-span-2">
          <AdminInput value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />
        </AdminField>
        <AdminField label="מודול">
          <AdminSelect value={form.module_id} onChange={(e) => set("module_id", e.target.value)}>
            <option value="">ללא</option>
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="סוג">
          <AdminSelect
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as LessonFormData["kind"])}
          >
            <option value="text">טקסט</option>
            <option value="video">סרטון בלבד</option>
            <option value="mixed">טקסט וסרטון</option>
          </AdminSelect>
        </AdminField>
        <AdminField label="זמן משוער (דקות)">
          <AdminInput
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={form.estimated_minutes}
            onChange={(e) => set("estimated_minutes", Number(e.target.value))}
          />
        </AdminField>
        <AdminField label="סדר תצוגה" hint="משמש רק לשיעורים ערוכים; הסדר בקורס נקבע בקבצי הקורס.">
          <AdminInput
            type="number"
            inputMode="numeric"
            min={0}
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
          />
        </AdminField>
        {showsVideo ? (
          <AdminField label="קישור לסרטון" required className="sm:col-span-2" hint="YouTube, Vimeo או קובץ, בכתובת https://">
            <AdminInput
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
              type="url"
            />
          </AdminField>
        ) : null}
      </div>

      {showsText ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              תוכן השיעור (Markdown)
              <span className="ms-2 font-normal text-muted">
                {usesCourseText ? "זהה לקבצי הקורס" : staticMarkdown.trim() ? "נערך" : ""}
              </span>
            </h2>
            <div className="flex items-center gap-1">
              {staticMarkdown.trim() && !usesCourseText ? (
                <AdminButton
                  tone="quiet"
                  onClick={() => {
                    if (confirm("להחזיר את הטקסט לגרסה מקבצי הקורס? השינויים בתיבה יימחקו.")) {
                      set("body_markdown", staticMarkdown);
                    }
                  }}
                >
                  החזרה לטקסט המקורי
                </AdminButton>
              ) : null}
              <AdminButton tone="quiet" onClick={() => setPreview((p) => !p)} aria-pressed={preview}>
                {preview ? "חזרה לעריכה" : "תצוגה מקדימה"}
              </AdminButton>
            </div>
          </div>

          {preview ? (
            <div className="prose prose-sm min-h-96 max-w-none overflow-auto border-y border-line py-5 text-ink">
              <MarkdownPreview source={form.body_markdown} />
            </div>
          ) : (
            <AdminTextarea
              aria-label="תוכן השיעור"
              value={form.body_markdown}
              onChange={(e) => set("body_markdown", e.target.value)}
              // Course content is Hebrew with English examples inside it. A hard LTR
              // box scrambled every Hebrew line; "auto" lets each line pick its direction.
              dir="auto"
              rows={28}
              className="font-mono"
            />
          )}
          <p className="text-xs text-muted">
            כותרות (#, ##), **מודגש**, *נטוי*, רשימות וטבלאות. התצוגה המקדימה מקורבת; הקובע הוא עמוד השיעור באתר.
          </p>
        </section>
      ) : null}
    </div>
  );
}

// Safe markdown preview: escape HTML first, then apply a small subset of markdown.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function MarkdownPreview({ source }: { source: string }) {
  if (!source.trim()) return <p className="text-muted">אין תוכן להצגה</p>;
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
  return <div dir="auto" dangerouslySetInnerHTML={{ __html: html }} />;
}
