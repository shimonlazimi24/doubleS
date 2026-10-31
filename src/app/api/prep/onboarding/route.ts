import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { onboardingPayloadSchema } from "@/lib/prep/onboarding/schema";

/**
 * GET is called by the course home for every visitor, signed in or not, to draw
 * the weekly goal. It used to answer 500 without Supabase and 401 for anonymous
 * visitors, so the public course page logged a failed request in every
 * logged-out browser. "No answers" is a normal state, not an error: 200.
 */
export async function GET() {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ configured: false, signedIn: false, completed: false });
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ configured: true, signedIn: false, completed: false });
  }
  // One query: `completed_at` is the completion flag, no need for a second read.
  const { data } = await client
    .from("prep_learner_onboarding")
    .select("completed_at, sorting_exam_date, sorting_exam_date_unknown, daily_study_time")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json(
    {
      configured: true,
      signedIn: true,
      completed: Boolean(data?.completed_at),
      sortingExamDate: data?.sorting_exam_date ?? null,
      sortingExamDateUnknown: data?.sorting_exam_date_unknown ?? true,
      dailyStudyTime: data?.daily_study_time ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    // Local development without Supabase: the wizard keeps the answers in the browser.
    return NextResponse.json({ configured: false, completed: false });
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "החיבור פג. התחברו שוב כדי לשמור את התשובות.", code: "signed_out" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "הבקשה לא תקינה. רעננו את הדף ונסו שוב." }, { status: 400 });
  }

  const parsed = onboardingPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "חלק מהתשובות לא תקינות", code: "invalid" },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const now = new Date().toISOString();

  // Re-submitting (edit mode, double click, a retry) must not wipe what the
  // wizard no longer asks: older accounts answered institution, field of study
  // and "how did you hear about us", and those columns are NOT NULL. They are
  // written only on the first save.
  const { data: existing } = await client
    .from("prep_learner_onboarding")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const answers = {
    user_id: user.id,
    sorting_exam_date: p.sortingExamDateUnknown ? null : p.sortingExamDate,
    sorting_exam_date_unknown: p.sortingExamDateUnknown,
    first_time_exam: p.firstTimeExam,
    first_time_exam_other: p.firstTimeExam === "other" ? p.firstTimeExamOther?.trim() || null : null,
    daily_study_time: p.dailyStudyTime,
    daily_study_time_other: p.dailyStudyTimeOther?.trim() || null,
    updated_at: now,
  };

  const { error } = existing
    ? await client.from("prep_learner_onboarding").update(answers).eq("user_id", user.id)
    : await client.from("prep_learner_onboarding").upsert(
        {
          ...answers,
          institution_name: p.institutionName.trim() || "לא צוין",
          field_of_study: p.fieldOfStudy.trim() || "לא צוין",
          heard_about: p.heardAbout,
          heard_about_other: p.heardAboutOther?.trim() || null,
          completed_at: now,
        },
        { onConflict: "user_id" },
      );

  if (error) {
    // eslint-disable-next-line no-console -- server trace; the learner gets a Hebrew sentence
    console.error(`[onboarding] save failed (${error.code ?? "unknown"}): ${error.message}`);
    return NextResponse.json({ error: "השמירה נכשלה. נסו שוב בעוד רגע." }, { status: 500 });
  }

  return NextResponse.json({ configured: true, completed: true });
}
