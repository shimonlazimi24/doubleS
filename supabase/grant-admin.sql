-- ============================================================
-- Grant / revoke PREPARE admin access.
--
-- Admin is read from `app_metadata` only: `user_metadata` is writable by the
-- account holder with the anon key, so a check on it would let any learner
-- promote themselves. See src/lib/prep/admin-auth.ts.
--
-- Run in the Supabase SQL Editor (service role). The user must have signed in
-- at least once so the row exists in auth.users.
-- ============================================================

-- 1. Confirm the account exists (and see the current flag).
select id, email, raw_app_meta_data ->> 'is_admin' as is_admin
from auth.users
where email = 'shachar.cygler@gmail.com';

-- 2. Grant.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
where email = 'shachar.cygler@gmail.com';

-- 3. Verify — expect is_admin = true.
select email, raw_app_meta_data ->> 'is_admin' as is_admin
from auth.users
where email = 'shachar.cygler@gmail.com';

-- The change lands in the JWT on the next sign-in: have them sign out and back
-- in before opening /prep/admin/lessons.

-- To revoke:
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data - 'is_admin'
-- where email = 'shachar.cygler@gmail.com';
