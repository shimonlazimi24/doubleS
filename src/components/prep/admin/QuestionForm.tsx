"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminSelect,
  AdminTextarea,
} from "./admin-ui";

type Option = { id: string; text: string };

export type QuestionFormData = {
  id: string;
  topic_slug: string;
  subtopic_slug: string;
  prompt: string;
  options: Option[];
  correct_option_id: string;
  explanation: string;
  difficulty: number;
  published: boolean;
};

/** Kept local (not imported from question-payload) so zod stays out of the browser bundle. */
const TOPICS = [
  { value: "vocabulary", label: "אוצר מילים" },
  { value: "sentence_completion", label: "השלמת משפטים" },
  { value: "rephrasing", label: "ניסוח מחדש" },
  { value: "reading_comprehension", label: "הבנת הנקרא" },
];

const DEFAULT_OPTIONS: Option[] = [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
];

const EMPTY: QuestionFormData = {
  id: "",
  topic_slug: "vocabulary",
  subtopic_slug: "",
  prompt: "",
  options: DEFAULT_OPTIONS,
  correct_option_id: "a",
  explanation: "",
  difficulty: 3,
  published: false,
};

export function QuestionForm({ initial }: { initial?: Partial<QuestionFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<QuestionFormData>({
    ...EMPTY,
    ...initial,
    options: initial?.options?.length ? initial.options : DEFAULT_OPTIONS,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isNew = !initial?.id;

  function setField<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setOption(idx: number, text: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? { ...o, text } : o)) }));
    setSaved(false);
  }

  function handleSave(mode: "keep" | "publish" | "unpublish") {
    setError(null);
    setSaved(false);
    const published = mode === "publish" ? true : mode === "unpublish" ? false : form.published;
    const payload = { ...form, published };

    if (!payload.prompt.trim()) return setError("חסר נוסח השאלה");
    if (payload.options.some((o) => !o.text.trim())) return setError("כל ארבע התשובות חייבות להיות מלאות");

    const url = isNew ? "/api/prep/admin/questions" : `/api/prep/admin/questions/${encodeURIComponent(form.id)}`;
    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
        if (!res.ok) {
          setError(data.error ?? `השמירה נכשלה (${res.status})`);
          return;
        }
        setForm((f) => ({ ...f, published }));
        setSaved(true);
        if (isNew && data.id) router.replace(`/prep/admin/questions/${encodeURIComponent(data.id)}`);
        else router.refresh();
      } catch {
        setError("שגיאת רשת. השאלה לא נשמרה.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("למחוק את השאלה? אי אפשר לבטל.")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/prep/admin/questions/${encodeURIComponent(form.id)}`, { method: "DELETE" });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "המחיקה נכשלה");
          return;
        }
        router.push("/prep/admin/questions");
        router.refresh();
      } catch {
        setError("שגיאת רשת. השאלה לא נמחקה.");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6" dir="rtl">
      <AdminPageHeader
        title={isNew ? "שאלה חדשה" : "עריכת שאלה"}
        subtitle={
          !isNew ? (
            <span dir="ltr" className="font-mono text-xs">
              {form.id}
            </span>
          ) : undefined
        }
        actions={
          <>
            {!isNew ? (
              <AdminButton tone="danger" onClick={handleDelete} disabled={isPending}>
                מחיקה
              </AdminButton>
            ) : null}
            {form.published ? (
              <AdminButton
                onClick={() => {
                  if (confirm("לבטל את הפרסום?")) handleSave("unpublish");
                }}
                disabled={isPending}
              >
                ביטול פרסום
              </AdminButton>
            ) : (
              <AdminButton onClick={() => handleSave("keep")} disabled={isPending}>
                שמירת טיוטה
              </AdminButton>
            )}
            <AdminButton tone="primary" onClick={() => handleSave("publish")} disabled={isPending}>
              {isPending ? "שומר…" : form.published ? "שמירה ופרסום" : "פרסום"}
            </AdminButton>
          </>
        }
      />

      <AdminNotice tone="warning">
        הבנק הזה לא מחובר לחידונים ולסימולציות. שמירה כאן לא משנה את מה שהתלמידים מתרגלים.
      </AdminNotice>

      <div aria-live="polite" className="empty:hidden">
        {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
        {saved && !error ? <AdminNotice tone="success">נשמר.</AdminNotice> : null}
      </div>

      {isNew ? (
        <AdminField label="מזהה" required hint="אותיות לטיניות קטנות, ספרות, נקודה או מקף. לא ניתן לשנות אחרי השמירה.">
          <AdminInput value={form.id} onChange={(e) => setField("id", e.target.value)} placeholder="q.vocab.101" dir="ltr" />
        </AdminField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="נושא" required>
          <AdminSelect value={form.topic_slug} onChange={(e) => setField("topic_slug", e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="רמת קושי" hint="1 קל, 6 קשה">
          <AdminSelect value={form.difficulty} onChange={(e) => setField("difficulty", Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </div>

      <AdminField label="תת-נושא">
        <AdminInput value={form.subtopic_slug} onChange={(e) => setField("subtopic_slug", e.target.value)} dir="ltr" />
      </AdminField>

      <AdminField label="השאלה" required>
        <AdminTextarea value={form.prompt} onChange={(e) => setField("prompt", e.target.value)} rows={4} dir="ltr" />
      </AdminField>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-medium text-muted">תשובות. סמנו את הנכונה.</legend>
        {form.options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-3">
            <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="correct"
                checked={form.correct_option_id === opt.id}
                onChange={() => setField("correct_option_id", opt.id)}
                className="h-4 w-4 accent-primary"
              />
              <span dir="ltr" className="w-4 font-semibold">
                {opt.id.toUpperCase()}
              </span>
            </label>
            <AdminInput
              aria-label={`תשובה ${opt.id.toUpperCase()}`}
              value={opt.text}
              onChange={(e) => setOption(idx, e.target.value)}
              dir="ltr"
            />
          </div>
        ))}
      </fieldset>

      <AdminField label="הסבר לתשובה">
        <AdminTextarea value={form.explanation} onChange={(e) => setField("explanation", e.target.value)} rows={3} dir="auto" />
      </AdminField>
    </div>
  );
}
