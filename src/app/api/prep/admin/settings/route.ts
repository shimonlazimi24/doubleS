import { NextResponse } from "next/server";
import { z } from "zod";
import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { assertServiceRoleKeyForWrites } from "@/lib/prep/supabase/service-role-check";
import { SITE_VIDEOS_SETTINGS_KEY } from "@/lib/prep/site-settings";

/**
 * Saves the site-level video slots. `prep_site_settings` has no write policy —
 * writes are service-role only — so the admin check happens here, on the user's
 * own session, before the service client is used.
 */

/** Accepts a media URL or an empty string (empty = do not show the slot). */
const videoUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), {
    message: "כתובת הסרטון חייבת להתחיל ב-https://",
  });

const BodySchema = z.object({
  home: videoUrl,
  courseRoadmap: videoUrl,
});

export async function PUT(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase לא מוגדר" }, { status: 500 });
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user || !isPrepAdminUser(user)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const service = getPrepSupabaseServiceClient();
  const keyStatus = assertServiceRoleKeyForWrites("admin/settings");
  if (!service || !keyStatus.ok) {
    return NextResponse.json(
      { error: "מפתח ה-service של Supabase אינו תקין, ולכן אי אפשר לשמור." },
      { status: 500 },
    );
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.issues[0]?.message ?? "קלט לא תקין")
        : "קלט לא תקין";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error } = await service.from("prep_site_settings").upsert(
    {
      key: SITE_VIDEOS_SETTINGS_KEY,
      value: parsed,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "key" },
  );

  if (error) {
    // eslint-disable-next-line no-console -- a silent save failure is how the checkout outage stayed hidden
    console.error(`[admin/settings] save failed (${error.code ?? "unknown"}): ${error.message}`);
    return NextResponse.json({ error: "השמירה נכשלה. נסו שוב." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, videos: parsed });
}
