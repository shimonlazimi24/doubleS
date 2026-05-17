-- Amirant Preparation — optional DB alignment (stable UUIDs can be added when wiring Supabase).
-- Source of truth for the shipped course is TypeScript: `src/lib/amirant-course/*`.
-- Run after `learning-intelligence-schema.sql` / course tables exist in your project.

-- Example placeholders (uncomment and adapt to your schema):
-- insert into public.courses (id, slug, title)
-- values ('00000000-0000-4000-8000-00000000a101', 'amirant-preparation', 'Amirant Preparation')
-- on conflict (slug) do nothing;
