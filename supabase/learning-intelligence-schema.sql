-- Learning Intelligence System - reference DDL for Postgres (Supabase).
-- Apply via migrations; enable RLS + policies per tenant model.
-- AI never writes scores/completion here - only ai_artifacts + optional chat logs.

-- ---------------------------------------------------------------------------
-- COURSE ENGINE
-- ---------------------------------------------------------------------------

create table if not exists course_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references course_categories (id) on delete set null,
  slug text not null,
  title text not null,
  description text,
  published boolean not null default false,
  version int not null default 1,
  created_at timestamptz not null default now(),
  unique (slug, version)
);
-- Note: if only one row per course slug, use `slug text not null unique` instead.

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create type lesson_kind as enum ('video', 'text', 'mixed');

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  kind lesson_kind not null default 'mixed',
  body_md text,
  video_storage_path text,
  video_duration_sec int,
  estimated_minutes int
);

create table if not exists lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  title text not null,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  slug text not null,
  label text not null,
  unique (course_id, slug)
);

create table if not exists subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics (id) on delete cascade,
  slug text not null,
  label text not null,
  unique (topic_id, slug)
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons (id) on delete set null,
  title text not null,
  time_limit_sec int,
  passing_score_pct int not null default 60,
  sort_order int not null default 0
);

create type question_type as enum ('single_choice', 'multiple_choice', 'short_text');

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  order_index int not null,
  prompt text not null,
  type question_type not null default 'single_choice',
  topic_id uuid references topics (id) on delete set null,
  subtopic_id uuid references subtopics (id) on delete set null,
  difficulty smallint not null default 2 check (difficulty between 1 and 6),
  explanation text,
  unique (quiz_id, order_index)
);

create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions (id) on delete cascade,
  order_index int not null,
  label text not null,
  is_correct boolean not null default false,
  unique (question_id, order_index)
);

create type enrollment_status as enum ('active', 'completed', 'paused', 'dropped');

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  status enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create type lesson_progress_status as enum ('not_started', 'in_progress', 'completed');

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  status lesson_progress_status not null default 'not_started',
  completed_at timestamptz,
  last_video_position_sec int,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references quizzes (id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score_pct int check (score_pct between 0 and 100),
  passed boolean
);

create index if not exists quiz_attempts_user_quiz_started on quiz_attempts (user_id, quiz_id, started_at desc);

create table if not exists quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts (id) on delete cascade,
  question_id uuid not null references quiz_questions (id) on delete cascade,
  selected_option_id uuid references question_options (id) on delete set null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- ---------------------------------------------------------------------------
-- EVENTS LAYER (append-only)
-- ---------------------------------------------------------------------------

create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  event_version smallint not null default 1,
  course_id uuid references courses (id) on delete set null,
  module_id uuid references modules (id) on delete set null,
  lesson_id uuid references lessons (id) on delete set null,
  quiz_id uuid references quizzes (id) on delete set null,
  attempt_id uuid references quiz_attempts (id) on delete set null,
  question_id uuid references quiz_questions (id) on delete set null,
  metadata jsonb not null default '{}',
  client_occurred_at timestamptz,
  created_at timestamptz not null default now(),
  dedupe_key text unique
);

create index if not exists learning_events_user_created on learning_events (user_id, created_at desc);
create index if not exists learning_events_type_created on learning_events (event_type, created_at desc);
create index if not exists learning_events_course on learning_events (course_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ANALYTICS LAYER (derived; updated by jobs or triggers - not by AI)
-- ---------------------------------------------------------------------------

create table if not exists learner_topic_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  topic_id uuid not null references topics (id) on delete cascade,
  questions_attempted int not null default 0 check (questions_attempted >= 0),
  questions_correct int not null default 0 check (questions_correct >= 0 and questions_correct <= questions_attempted),
  accuracy numeric(6, 5) not null default 0,
  confidence numeric(6, 5) not null default 0,
  trend_slope numeric(8, 6),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, topic_id)
);

create table if not exists student_profiles_summary (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  lessons_completed int not null default 0,
  lessons_total int not null default 0,
  quizzes_completed int not null default 0,
  avg_quiz_score_pct numeric(5, 2),
  time_on_task_minutes_est numeric(10, 2) not null default 0,
  weak_topic_ids uuid[] not null default '{}',
  strong_topic_ids uuid[] not null default '{}',
  last_computed_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ---------------------------------------------------------------------------
-- AI LAYER (artifacts only - never authoritative for grades)
-- ---------------------------------------------------------------------------

create type ai_artifact_kind as enum (
  'tutor_message',
  'quiz_explanation',
  'weak_topic_summary',
  'coach_summary',
  'recommendation_copy'
);

create table if not exists ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  kind ai_artifact_kind not null,
  lesson_id uuid references lessons (id) on delete set null,
  quiz_id uuid references quizzes (id) on delete set null,
  attempt_id uuid references quiz_attempts (id) on delete set null,
  model text not null,
  prompt_hash text,
  input_refs jsonb not null default '[]',
  output jsonb not null,
  output_schema_version smallint not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists ai_artifacts_user_course on ai_artifacts (user_id, course_id, created_at desc);

-- RLS: enable on all user-scoped tables; policies omitted here (tenant-specific).
