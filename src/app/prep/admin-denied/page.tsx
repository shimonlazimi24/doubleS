import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Text } from "@/components/ui";
import { AdminSignOutButton } from "@/components/prep/admin/AdminSignOutButton";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

export const metadata: Metadata = {
  title: "אין הרשאת ניהול",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Where a signed-in account without the admin flag lands.
 *
 * It used to be sent to /prep/login?next=/prep/admin. The login form sends a
 * signed-in visitor straight to `next`, the middleware sent them back to login,
 * and the browser bounced between the two until it gave up. That is also what a
 * freshly granted admin saw, because the flag reaches the session token only
 * after signing in again.
 */
export default async function AdminDeniedPage() {
  const client = createPrepSupabaseServerClient();
  const email = client ? (await client.auth.getUser()).data.user?.email ?? null : null;

  return (
    <Container max="measure" className="py-14">
      <div dir="rtl" className="max-w-lg">
        <Heading level={3} as="h1">
          לחשבון הזה אין הרשאת ניהול
        </Heading>
        <Text variant="body" className="mt-3">
          {email ? (
            <>
              מחוברים כ-<span dir="ltr">{email}</span>.{" "}
            </>
          ) : null}
          אם הרשאה ניתנה לחשבון הזה זה עתה, צריך להתנתק ולהתחבר שוב כדי שהיא תיכנס לתוקף.
        </Text>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <AdminSignOutButton
            label="התנתקות והתחברות מחדש"
            next="/prep/admin"
            className="rounded-control bg-primary px-5 font-semibold text-white hover:bg-primary-hover hover:text-white"
          />
          <Link href="/prep" className="inline-flex min-h-11 items-center px-3 text-sm text-muted hover:text-ink">
            לאתר
          </Link>
        </div>
      </div>
    </Container>
  );
}
