-- Fix CMS admin RLS: trust app_metadata.is_admin (server-controlled),
-- not user_metadata (client-writable via updateUser).
-- Also stop public SELECT on cms_questions (exposes correct_option_id).
--
-- Safe if CMS tables were never created in this project (no-op).

DO $$
BEGIN
  IF to_regclass('public.cms_modules') IS NULL THEN
    RAISE NOTICE 'cms_modules missing — skip CMS RLS (run supabase/cms-schema.sql first if you need CMS admin)';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "cms_modules_admin_all" ON cms_modules;
  DROP POLICY IF EXISTS "cms_lessons_admin_all" ON cms_lessons;
  DROP POLICY IF EXISTS "cms_questions_admin_all" ON cms_questions;
  DROP POLICY IF EXISTS "cms_questions_public_read" ON cms_questions;

  CREATE POLICY "cms_modules_admin_all" ON cms_modules
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true);

  CREATE POLICY "cms_lessons_admin_all" ON cms_lessons
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true);

  CREATE POLICY "cms_questions_admin_all" ON cms_questions
    FOR ALL
    USING ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true);
END $$;

-- Published lessons/modules stay publicly readable for student override path.
-- Questions: admin-only (live quizzes use imported bank, not CMS).
