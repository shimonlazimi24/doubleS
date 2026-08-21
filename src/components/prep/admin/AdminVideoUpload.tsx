"use client";

import { useRef, useState } from "react";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { AdminButton } from "./admin-ui";

/**
 * Uploads a video file and hands back its public URL.
 *
 * The file goes from the browser straight to Supabase Storage, never through
 * our own server: a Vercel function has a request-body ceiling around 4.5MB,
 * which any real video exceeds. The bucket allows public reads and admin-only
 * writes, enforced in Postgres — see supabase/site-settings-schema.sql.
 */

const BUCKET = "site-media";
const MAX_BYTES = 500 * 1024 * 1024;
const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** Keeps the object name predictable and free of characters Storage rejects. */
function objectName(slot: string, file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "mp4";
  return `${slot}-${Date.now()}.${ext.replace(/[^a-z0-9]/g, "")}`;
}

export function AdminVideoUpload({
  slot,
  onUploaded,
}: {
  slot: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError(`סוג קובץ לא נתמך (${file.type || "לא ידוע"}). נתמכים: MP4, WebM, MOV.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`הקובץ ${formatMb(file.size)} — המקסימום הוא ${formatMb(MAX_BYTES)}.`);
      return;
    }

    const supabase = createPrepSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase לא מוגדר בדפדפן.");
      return;
    }

    setBusy(true);
    setFileName(file.name);
    try {
      const path = objectName(slot, file);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(
          /row-level security|not authorized|Unauthorized/i.test(uploadError.message)
            ? "אין הרשאת העלאה. ודאו שהחשבון מסומן כאדמין ושהרצתם את site-settings-schema.sql."
            : `ההעלאה נכשלה: ${uploadError.message}`,
        );
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) {
        setError("ההעלאה הצליחה אבל לא התקבלה כתובת ציבורית.");
        return;
      }
      onUploaded(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ההעלאה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "מעלה…" : "העלאת קובץ וידאו"}
        </AdminButton>
        <span className="text-xs text-muted">
          {busy && fileName ? fileName : `MP4, WebM או MOV · עד ${formatMb(MAX_BYTES)}`}
        </span>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
