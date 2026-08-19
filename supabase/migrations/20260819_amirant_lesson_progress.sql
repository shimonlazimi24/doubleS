-- Amirant course local-id progress table (client lesson IDs are text, not UUID).
-- Used by `createSupabaseAmirantProgressService`.

create table if not exists amirant_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists amirant_lesson_progress_user_updated
  on amirant_lesson_progress (user_id, updated_at desc);

create index if not exists amirant_lesson_progress_user_status
  on amirant_lesson_progress (user_id, status);

alter table amirant_lesson_progress enable row level security;

-- No anonymous access: anon has no matching authenticated role and no permissive policies.
drop policy if exists amirant_lesson_progress_select_own on amirant_lesson_progress;
create policy amirant_lesson_progress_select_own
  on amirant_lesson_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists amirant_lesson_progress_insert_own on amirant_lesson_progress;
create policy amirant_lesson_progress_insert_own
  on amirant_lesson_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists amirant_lesson_progress_update_own on amirant_lesson_progress;
create policy amirant_lesson_progress_update_own
  on amirant_lesson_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete intentionally disallowed for MVP: no DELETE policy is created.
