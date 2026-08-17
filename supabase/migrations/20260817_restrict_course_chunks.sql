-- Restrict course_content_chunks to entitled users; revoke match RPC from authenticated.
-- Retrieval should use service role (already preferred in retrieval.ts).
-- Safe no-op if chunks table / RPC were never provisioned in this project.

DO $$
BEGIN
  IF to_regclass('public.course_content_chunks') IS NULL THEN
    RAISE NOTICE 'course_content_chunks missing — skip chunk RLS';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS course_content_chunks_auth_read ON course_content_chunks;
  DROP POLICY IF EXISTS "course_content_chunks_entitled_read" ON course_content_chunks;

  CREATE POLICY course_content_chunks_entitled_read ON course_content_chunks
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM course_entitlements e
        WHERE e.user_id = auth.uid()
          AND e.access_type IN ('paid', 'admin')
          AND e.starts_at <= now()
          AND (e.ends_at IS NULL OR e.ends_at > now())
      )
    );
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.match_course_content_chunks(vector, integer, text, text, text)') IS NULL THEN
    RAISE NOTICE 'match_course_content_chunks missing — skip RPC grants';
    RETURN;
  END IF;

  REVOKE EXECUTE ON FUNCTION match_course_content_chunks(vector, int, text, text, text) FROM authenticated;
  REVOKE EXECUTE ON FUNCTION match_course_content_chunks(vector, int, text, text, text) FROM anon;
  GRANT EXECUTE ON FUNCTION match_course_content_chunks(vector, int, text, text, text) TO service_role;
END $$;
