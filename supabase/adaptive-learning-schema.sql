-- Adaptive learning — additive tables (see src/lib/learning-intelligence/adaptive/).
-- Run after learning-intelligence-schema.sql. RLS per tenant policy TBD.

-- Per learner, course, topic: level + streaks + rolling outcomes for adaptive rules.
create table if not exists learner_adaptive_topic_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  topic_id uuid not null references topics (id) on delete cascade,
  current_level smallint not null default 3 check (current_level between 1 and 5),
  correct_streak int not null default 0 check (correct_streak >= 0),
  wrong_streak int not null default 0 check (wrong_streak >= 0),
  total_answered int not null default 0 check (total_answered >= 0),
  correct_answered int not null default 0 check (correct_answered >= 0 and correct_answered <= total_answered),
  -- Cap length in application (e.g. last 10 booleans, oldest first).
  recent_outcomes boolean[] not null default '{}',
  sum_response_time_sec numeric(14, 4) not null default 0,
  last_answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, topic_id)
);

-- Finer granularity for weak-topic / tutor context (deterministic aggregates).
create table if not exists learner_subtopic_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  topic_id uuid not null references topics (id) on delete cascade,
  subtopic_id uuid not null references subtopics (id) on delete cascade,
  total_answered int not null default 0 check (total_answered >= 0),
  correct_answered int not null default 0,
  wrong_answered int not null default 0 check (wrong_answered + correct_answered <= total_answered),
  sum_response_time_sec numeric(14, 4) not null default 0,
  last_answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, topic_id, subtopic_id)
);

create index if not exists learner_subtopic_stats_user_course on learner_subtopic_stats (user_id, course_id);

-- Recent question usage — avoid repeating same question too often (optional; cap rows in app).
create table if not exists learner_question_exposure (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  question_id uuid not null references quiz_questions (id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  seen_count int not null default 1 check (seen_count >= 1),
  primary key (user_id, course_id, question_id)
);
