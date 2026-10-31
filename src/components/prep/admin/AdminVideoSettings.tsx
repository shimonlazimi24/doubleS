"use client";

import { useState, useTransition } from "react";
import { AmirantVideoEmbed } from "@/components/prep/amirant-course/lesson/AmirantVideoEmbed";
import { AdminVideoUpload } from "./AdminVideoUpload";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminNotice,
  AdminSection,
} from "./admin-ui";
import { SITE_VIDEO_SLOTS, type SiteVideos } from "@/lib/prep/site-settings";

const SLOTS = Object.entries(SITE_VIDEO_SLOTS) as [
  keyof typeof SITE_VIDEO_SLOTS,
  (typeof SITE_VIDEO_SLOTS)[keyof typeof SITE_VIDEO_SLOTS],
][];

export function AdminVideoSettings({ initial }: { initial: SiteVideos }) {
  const [videos, setVideos] = useState<SiteVideos>(initial);
  // What the server holds. Comparing against the `initial` prop kept the form
  // "dirty" after a successful save, so the success line never showed and the
  // unsaved-changes warning stayed up.
  const [baseline, setBaseline] = useState<SiteVideos>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = SLOTS.some(([slot]) => videos[slot] !== baseline[slot]);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/prep/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(videos),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; videos?: SiteVideos };
        if (!res.ok) {
          setError(data.error ?? `השמירה נכשלה (${res.status})`);
          return;
        }
        const stored = data.videos ?? videos;
        setVideos(stored);
        setBaseline(stored);
        setSaved(true);
      } catch {
        setError("שגיאת רשת. השינויים לא נשמרו.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
      {saved && !dirty ? <AdminNotice tone="success">נשמר. העמודים הציבוריים מתעדכנים תוך כמה דקות (מטמון CDN).</AdminNotice> : null}

      {SLOTS.map(([slot, meta]) => (
        <AdminSection key={slot} title={meta.label} description={meta.hint}>
          <AdminVideoUpload
            slot={slot}
            onUploaded={(url) => {
              setSaved(false);
              setVideos((v) => ({ ...v, [slot]: url }));
            }}
          />

          <AdminField
            label="או הדבקת קישור"
            hint="YouTube, Vimeo, או כתובת ישירה לקובץ. העלאה ממלאת את השדה הזה אוטומטית."
          >
            <AdminInput
              value={videos[slot]}
              onChange={(e) => {
                setSaved(false);
                setVideos((v) => ({ ...v, [slot]: e.target.value }));
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
            />
          </AdminField>

          {videos[slot].trim() ? (
            <div className="pt-1">
              <p className="mb-2 text-xs text-muted">תצוגה מקדימה</p>
              <AmirantVideoEmbed src={videos[slot]} title={meta.label} />
            </div>
          ) : (
            <p className="text-xs text-muted">ריק: הסרטון לא יוצג באתר.</p>
          )}
        </AdminSection>
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <AdminButton tone="primary" onClick={save} disabled={isPending || !dirty}>
          {isPending ? "שומר…" : "שמור"}
        </AdminButton>
        {dirty ? (
          <span className="text-xs text-muted">יש שינויים שלא נשמרו. גם קובץ שהועלה מופיע באתר רק אחרי שמירה.</span>
        ) : null}
      </div>
    </div>
  );
}
