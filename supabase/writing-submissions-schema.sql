-- ============================================================
-- prep_writing_submissions - practice essays for the AMIRNET writing task
-- and the grader's verdict. Run in the Supabase SQL editor (idempotent).
-- Writes happen on the server through the service role; the learner can
-- read their own rows.
-- ============================================================

create table if not exists prep_writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  text text not null,
  word_count int not null,
  status text not null default 'grading'
    check (status in ('grading', 'graded', 'failed')),
  -- The structured verdict (levels, feedback, flagged errors); null until graded.
  result jsonb,
  model text,
  created_at timestamptz not null default now(),
  graded_at timestamptz
);

create index if not exists prep_writing_submissions_user_created
  on prep_writing_submissions (user_id, created_at desc);

create index if not exists prep_writing_submissions_user_task_created
  on prep_writing_submissions (user_id, task_id, created_at desc);

alter table prep_writing_submissions enable row level security;

drop policy if exists prep_writing_submissions_select_own on prep_writing_submissions;
create policy prep_writing_submissions_select_own
  on prep_writing_submissions
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies: the service role alone writes (submit route).
