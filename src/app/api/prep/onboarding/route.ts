import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { hasCompletedPrepOnboarding } from "@/lib/prep/onboarding/gate";
import { onboardingPayloadSchema } from "@/lib/prep/onboarding/schema";

export async function GET() {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ completed: false }, { status: 401 });
  }
  const completed = await hasCompletedPrepOnboarding(client, user.id);
  return NextResponse.json({ completed });
}

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = onboardingPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const now = new Date().toISOString();

  const { error } = await client.from("prep_learner_onboarding").upsert(
    {
      user_id: user.id,
      sorting_exam_date: p.sortingExamDateUnknown ? null : p.sortingExamDate,
      sorting_exam_date_unknown: p.sortingExamDateUnknown,
      institution_name: p.institutionName.trim(),
      field_of_study: p.fieldOfStudy.trim(),
      first_time_exam: p.firstTimeExam,
      first_time_exam_other: p.firstTimeExamOther?.trim() || null,
      daily_study_time: p.dailyStudyTime,
      daily_study_time_other: p.dailyStudyTimeOther?.trim() || null,
      heard_about: p.heardAbout,
      heard_about_other: p.heardAboutOther?.trim() || null,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ completed: true });
}
