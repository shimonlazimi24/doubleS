"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

const TOPICS = [
  { value: "vocabulary", label: "Vocabulary - אוצר מילים" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "rephrasing", label: "Restatement / Rephrasing" },
  { value: "reading_comprehension", label: "Reading Comprehension" },
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
  const [isPending, startTransition] = useTransition();

  const isNew = !initial?.id;

  function setField<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setOption(idx: number, text: string) {
    setForm((f) => {
      const options = f.options.map((o, i) => (i === idx ? { ...o, text } : o));
      return { ...f, options };
    });
  }

  async function handleSave(publish?: boolean) {
    setError(null);
    const payload = { ...form };
    if (publish !== undefined) payload.published = publish;

    if (!payload.prompt.trim()) { setError("שאלה היא שדה חובה"); return; }
    if (payload.options.some((o) => !o.text.trim())) { setError("כל 4 אפשרויות התשובה חייבות להיות מלאות"); return; }

    const url = isNew ? "/api/prep/admin/questions" : `/api/prep/admin/questions/${form.id}`;
    const method = isNew ? "POST" : "PATCH";

    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: "שגיאה" }));
          setError(msg ?? "שגיאה");
          return;
        }
        const { id } = await res.json();
        if (isNew && id) {
          router.push(`/prep/admin/questions/${id}`);
        } else {
          router.refresh();
        }
      } catch {
        setError("שגיאת רשת");
      }
    });
  }

  async function handleDelete() {
    if (!confirm("למחוק את השאלה לצמיתות?")) return;
    startTransition(async () => {
      await fetch(`/api/prep/admin/questions/${form.id}`, { method: "DELETE" });
      router.push("/prep/admin/questions");
    });
  }

  return (
    <div className="max-w-2xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? "שאלה חדשה" : "עריכת שאלה"}</h1>
          {!isNew && <p className="text-zinc-500 text-xs mt-1 font-mono">{form.id}</p>}
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-900 rounded-lg">
              מחק
            </button>
          )}
          <button onClick={() => handleSave(false)} disabled={isPending} className="px-4 py-2 text-sm bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50">
            שמור טיוטה
          </button>
          <button onClick={() => handleSave(true)} disabled={isPending} className="px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-50">
            {form.published ? "עדכן ופרסם" : "פרסם"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">{error}</div>
      )}

      {isNew && (
        <div className="mb-4">
          <label className="block text-xs text-zinc-400 mb-1">מזהה (ID) *</label>
          <input value={form.id} onChange={(e) => setField("id", e.target.value)} placeholder="q.vocab.101" dir="ltr"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">נושא *</label>
          <select value={form.topic_slug} onChange={(e) => setField("topic_slug", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">רמת קושי (1=קל, 6=קשה)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" onClick={() => setField("difficulty", d)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.difficulty === d ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1">תת-נושא (אופציונלי)</label>
        <input value={form.subtopic_slug} onChange={(e) => setField("subtopic_slug", e.target.value)} placeholder="verbs, adjectives, ..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1">השאלה / המשפט *</label>
        <textarea value={form.prompt} onChange={(e) => setField("prompt", e.target.value)} rows={4}
          placeholder="The scientist was known for her _______ approach to problem-solving, often finding creative solutions where others saw only obstacles."
          dir="ltr"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500 resize-y" />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-2">אפשרויות תשובה - לחץ על הנכונה</label>
        <div className="space-y-2">
          {form.options.map((opt, idx) => (
            <div key={opt.id} className="flex gap-3 items-center">
              <button type="button" onClick={() => setField("correct_option_id", opt.id)}
                className={`w-8 h-8 shrink-0 rounded-full text-xs font-bold border-2 transition ${form.correct_option_id === opt.id ? "bg-green-500 border-green-500 text-white" : "border-zinc-600 text-zinc-400 hover:border-zinc-400"}`}>
                {opt.id.toUpperCase()}
              </button>
              <input value={opt.text} onChange={(e) => setOption(idx, e.target.value)} placeholder={`אפשרות ${opt.id.toUpperCase()}`} dir="ltr"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">לחץ על הכפתור העגול לסמן את התשובה הנכונה (ירוק)</p>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">הסבר לתשובה (יוצג אחרי מענה)</label>
        <textarea value={form.explanation} onChange={(e) => setField("explanation", e.target.value)} rows={3} dir="ltr"
          placeholder="The word 'innovative' means..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-y" />
      </div>
    </div>
  );
}
