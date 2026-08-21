import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { AdminVideoSettings } from "@/components/prep/admin/AdminVideoSettings";
import { getSiteVideos } from "@/lib/prep/site-settings.server";

export const metadata: Metadata = { title: "סרטונים | PREPARE admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const videos = await getSiteVideos();

  return (
    <div dir="rtl" className="max-w-2xl space-y-6">
      <AdminPageHeader
        title="סרטונים"
        subtitle="סרטוני פתיחה בעמוד הבית ובעמוד הקורס. שינוי כאן משפיע על האתר מיד."
      />
      <AdminVideoSettings initial={videos} />
    </div>
  );
}
