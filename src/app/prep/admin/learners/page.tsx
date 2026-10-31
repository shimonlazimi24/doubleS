import type { Metadata } from "next";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { AdminLearnerTable } from "@/components/prep/admin/AdminLearnerTable";
import { learnerTotals } from "@/lib/prep/admin/learner-rows";
import { loadAdminLearners } from "@/lib/prep/admin/learners.server";

export const metadata: Metadata = { title: "נרשמים | PREPARE admin" };
export const dynamic = "force-dynamic";

export default async function AdminLearnersPage() {
  const { rows, error, truncated } = await loadAdminLearners();
  const totals = learnerTotals(rows);

  return (
    <div dir="rtl" className="space-y-6">
      <AdminPageHeader
        title="נרשמים"
        subtitle={
          error
            ? "כל מי שנכנס לאתר עם חשבון, תשובות השאלון והגישה לקורס."
            : `${totals.signedUp} חשבונות · ${totals.onboarded} מילאו שאלון · ${totals.paidActive} עם גישה בתשלום בתוקף`
        }
      />

      {truncated ? (
        <AdminNotice tone="warning">מוצגים 10,000 החשבונות הראשונים בלבד.</AdminNotice>
      ) : null}

      {error ? <AdminNotice tone="error">{error}</AdminNotice> : <AdminLearnerTable rows={rows} />}
    </div>
  );
}
