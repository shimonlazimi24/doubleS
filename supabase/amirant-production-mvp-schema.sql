-- Amirant production MVP persistence + AI artifacts.
-- This migration is additive and keeps client-side anon access protected by RLS.

create extension if not exists vector;

create table if not exists amirant_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null,
  source_mode text not null check (source_mode in ('production', 'demo')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score_pct int check (score_pct between 0 and 100),
  question_count int not null default 0,
  correct_count int not null default 0,
  start_level smallint check (start_level between 1 and 6),
  end_level smallint check (end_level between 1 and 6),
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists amirant_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null references amirant_quiz_attempts (id) on delete cascade,
  question_id text not null,
  topic text not null,
  subtopic text,
  difficulty smallint not null check (difficulty between 1 and 6),
  selected_option_id text,
  correct_option_id text not null,
  is_correct boolean not null,
  response_time_ms int,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists amirant_simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  simulation_id text not null,
  source_mode text not null check (source_mode in ('production', 'demo')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score_pct int check (score_pct between 0 and 100),
  scored_question_count int not null default 0,
  scored_correct_count int not null default 0,
  start_level smallint check (start_level between 1 and 6),
  end_level smallint check (end_level between 1 and 6),
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists amirant_simulation_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null references amirant_simulation_attempts (id) on delete cascade,
  section_index int not null,
  section_kind text not null check (section_kind in ('pilot', 'scored')),
  section_label text not null,
  topic text not null,
  enter_level smallint check (enter_level between 1 and 6),
  question_count int not null,
  correct_count int not null default 0,
  time_limit_sec int not null,
  elapsed_sec int,
  answers jsonb not null default '[]',
  submitted_at timestamptz not null default now(),
  unique (attempt_id, section_index, section_kind)
);

create table if not exists amirant_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  course_id text not null default 'amirant-preparation-v1',
  lesson_id text,
  quiz_attempt_id uuid references amirant_quiz_attempts (id) on delete set null,
  simulation_attempt_id uuid references amirant_simulation_attempts (id) on delete set null,
  metadata jsonb not null default '{}'
);

create table if not exists amirant_adaptive_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  current_level smallint not null check (current_level between 1 and 6),
  correct_streak int not null default 0,
  wrong_streak int not null default 0,
  recent_accuracy numeric(6,5),
  last_question_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create table if not exists amirant_topic_rollups (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  total_answered int not null default 0,
  total_correct int not null default 0,
  avg_response_ms int,
  by_difficulty jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create table if not exists amirant_cross_test_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_end_level smallint not null check (last_end_level between 1 and 6),
  last_score_pct int not null check (last_score_pct between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists amirant_ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  insight_kind text not null check (insight_kind in ('lesson_chat','quiz_review','recommendations','coach_summary')),
  model text not null,
  prompt_version text not null,
  input_refs jsonb not null default '[]',
  input_payload jsonb not null default '{}',
  output_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists course_content_chunks (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null default 'amirant-preparation',
  module_slug text,
  lesson_id text,
  topic text,
  chunk_text text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists course_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  access_type text not null check (access_type in ('free', 'paid', 'admin')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_slug)
);

create index if not exists amirant_quiz_attempts_user_started on amirant_quiz_attempts (user_id, started_at desc);
create index if not exists amirant_quiz_answers_user_topic on amirant_quiz_answers (user_id, topic);
create index if not exists amirant_sim_attempts_user_started on amirant_simulation_attempts (user_id, started_at desc);
create index if not exists amirant_learning_events_user_type on amirant_learning_events (user_id, event_type, occurred_at desc);
create index if not exists amirant_ai_insights_user_kind on amirant_ai_insights (user_id, insight_kind, created_at desc);
create index if not exists course_content_chunks_course_lesson on course_content_chunks (course_slug, lesson_id);
create index if not exists course_content_chunks_embedding_idx
on course_content_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_course_content_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_course_slug text default 'amirant-preparation',
  filter_lesson_id text default null,
  filter_topic text default null
)
returns table (
  id uuid,
  lesson_id text,
  topic text,
  chunk_text text,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.lesson_id,
    c.topic,
    c.chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity
  from course_content_chunks c
  where c.course_slug = filter_course_slug
    and c.embedding is not null
    and (filter_lesson_id is null or c.lesson_id = filter_lesson_id)
    and (filter_topic is null or c.topic = filter_topic)
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

alter table amirant_quiz_attempts enable row level security;
alter table amirant_quiz_answers enable row level security;
alter table amirant_simulation_attempts enable row level security;
alter table amirant_simulation_sections enable row level security;
alter table amirant_learning_events enable row level security;
alter table amirant_adaptive_state enable row level security;
alter table amirant_topic_rollups enable row level security;
alter table amirant_cross_test_state enable row level security;
alter table amirant_ai_insights enable row level security;
alter table course_entitlements enable row level security;
alter table course_content_chunks enable row level security;

drop policy if exists amirant_quiz_attempts_own_select on amirant_quiz_attempts;
create policy amirant_quiz_attempts_own_select on amirant_quiz_attempts for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_quiz_attempts_own_insert on amirant_quiz_attempts;
create policy amirant_quiz_attempts_own_insert on amirant_quiz_attempts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_quiz_attempts_own_update on amirant_quiz_attempts;
create policy amirant_quiz_attempts_own_update on amirant_quiz_attempts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_quiz_answers_own_select on amirant_quiz_answers;
create policy amirant_quiz_answers_own_select on amirant_quiz_answers for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_quiz_answers_own_insert on amirant_quiz_answers;
create policy amirant_quiz_answers_own_insert on amirant_quiz_answers for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_quiz_answers_own_update on amirant_quiz_answers;
create policy amirant_quiz_answers_own_update on amirant_quiz_answers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_sim_attempts_own_select on amirant_simulation_attempts;
create policy amirant_sim_attempts_own_select on amirant_simulation_attempts for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_sim_attempts_own_insert on amirant_simulation_attempts;
create policy amirant_sim_attempts_own_insert on amirant_simulation_attempts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_sim_attempts_own_update on amirant_simulation_attempts;
create policy amirant_sim_attempts_own_update on amirant_simulation_attempts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_sim_sections_own_select on amirant_simulation_sections;
create policy amirant_sim_sections_own_select on amirant_simulation_sections for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_sim_sections_own_insert on amirant_simulation_sections;
create policy amirant_sim_sections_own_insert on amirant_simulation_sections for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_sim_sections_own_update on amirant_simulation_sections;
create policy amirant_sim_sections_own_update on amirant_simulation_sections for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_learning_events_own_select on amirant_learning_events;
create policy amirant_learning_events_own_select on amirant_learning_events for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_learning_events_own_insert on amirant_learning_events;
create policy amirant_learning_events_own_insert on amirant_learning_events for insert to authenticated with check (user_id = auth.uid());

drop policy if exists amirant_adaptive_state_own_select on amirant_adaptive_state;
create policy amirant_adaptive_state_own_select on amirant_adaptive_state for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_adaptive_state_own_insert on amirant_adaptive_state;
create policy amirant_adaptive_state_own_insert on amirant_adaptive_state for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_adaptive_state_own_update on amirant_adaptive_state;
create policy amirant_adaptive_state_own_update on amirant_adaptive_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_topic_rollups_own_select on amirant_topic_rollups;
create policy amirant_topic_rollups_own_select on amirant_topic_rollups for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_topic_rollups_own_insert on amirant_topic_rollups;
create policy amirant_topic_rollups_own_insert on amirant_topic_rollups for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_topic_rollups_own_update on amirant_topic_rollups;
create policy amirant_topic_rollups_own_update on amirant_topic_rollups for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_cross_test_state_own_select on amirant_cross_test_state;
create policy amirant_cross_test_state_own_select on amirant_cross_test_state for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_cross_test_state_own_insert on amirant_cross_test_state;
create policy amirant_cross_test_state_own_insert on amirant_cross_test_state for insert to authenticated with check (user_id = auth.uid());
drop policy if exists amirant_cross_test_state_own_update on amirant_cross_test_state;
create policy amirant_cross_test_state_own_update on amirant_cross_test_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists amirant_ai_insights_own_select on amirant_ai_insights;
create policy amirant_ai_insights_own_select on amirant_ai_insights for select to authenticated using (user_id = auth.uid());
drop policy if exists amirant_ai_insights_own_insert on amirant_ai_insights;
create policy amirant_ai_insights_own_insert on amirant_ai_insights for insert to authenticated with check (user_id = auth.uid());

drop policy if exists course_entitlements_own_select on course_entitlements;
create policy course_entitlements_own_select on course_entitlements for select to authenticated using (user_id = auth.uid());

drop policy if exists course_content_chunks_auth_read on course_content_chunks;
create policy course_content_chunks_entitled_read on course_content_chunks
  for select to authenticated
  using (
    exists (
      select 1 from course_entitlements e
      where e.user_id = auth.uid()
        and e.access_type in ('paid', 'admin')
        and e.starts_at <= now()
        and (e.ends_at is null or e.ends_at > now())
    )
  );
-- match RPC: service_role only (app retrieval uses service client)
revoke execute on function match_course_content_chunks(vector, int, text, text, text) from authenticated;
revoke execute on function match_course_content_chunks(vector, int, text, text, text) from anon;
grant execute on function match_course_content_chunks(vector, int, text, text, text) to service_role;
