import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { redirect } from "next/navigation";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { AdminShell } from "@/components/prep/admin/AdminShell";

/**
 * גייט שרת לאדמין - הגנת עומק בנוסף ל-middleware (שגם בודק is_admin).
 * לא-אדמין מנותב ל-login לפני שהעמוד מרונדר בכלל.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isPrepAuthBypassEnabled()) {
    const client = createPrepSupabaseServerClient();
    const user = client ? (await client.auth.getUser()).data.user : null;
    if (!user || !isPrepAdminUser(user)) {
      redirect("/prep/login?next=/prep/admin");
    }
  }
  return <AdminShell>{children}</AdminShell>;
}
