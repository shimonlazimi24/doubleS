-- prePare learner onboarding questionnaire (required after first login).

create table if not exists prep_learner_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sorting_exam_date date,
  sorting_exam_date_unknown boolean not null default false,
  institution_name text not null,
  field_of_study text not null,
  first_time_exam text not null check (first_time_exam in ('yes', 'no', 'other')),
  first_time_exam_other text,
  daily_study_time text not null,
  daily_study_time_other text,
  heard_about text[] not null default '{}',
  heard_about_other text,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prep_learner_onboarding_completed
  on prep_learner_onboarding (completed_at desc);

alter table prep_learner_onboarding enable row level security;

drop policy if exists prep_learner_onboarding_select_own on prep_learner_onboarding;
create policy prep_learner_onboarding_select_own
  on prep_learner_onboarding for select to authenticated
  using (user_id = auth.uid());

drop policy if exists prep_learner_onboarding_insert_own on prep_learner_onboarding;
create policy prep_learner_onboarding_insert_own
  on prep_learner_onboarding for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists prep_learner_onboarding_update_own on prep_learner_onboarding;
create policy prep_learner_onboarding_update_own
  on prep_learner_onboarding for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
