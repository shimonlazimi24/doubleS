-- Optional: demo learner rows - run AFTER `amirant-demo.sql` and AFTER you have a real `auth.users` id.
-- Replace the UUID below with your test user (Supabase Auth → Users, or sign up once and copy id).

-- \set demo_user '''YOUR-USER-UUID-HERE'''

BEGIN;

-- Example (uncomment and set user id):
-- INSERT INTO enrollments (id, user_id, course_id, status)
-- VALUES (
--   '30000001-0000-4000-8000-000000000001',
--   'YOUR-USER-UUID-HERE',
--   '20000001-0000-4000-8000-000000000002',
--   'active'
-- )
-- ON CONFLICT (user_id, course_id) DO NOTHING;

-- Optional: mark first lesson in progress
-- INSERT INTO lesson_progress (user_id, lesson_id, status, updated_at)
-- VALUES (
--   'YOUR-USER-UUID-HERE',
--   '20000001-0000-4000-8000-000000000021',
--   'in_progress',
--   now()
-- )
-- ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

COMMIT;
