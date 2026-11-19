-- Leads from the "course completed" page (/api/prep/completion-contact).
-- The route writes with the service role; the table was never created, so every
-- submission failed with 502. RLS is on with no policies: only the service role
-- (and the Supabase dashboard) can read or write.

CREATE TABLE IF NOT EXISTS public.completion_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  course text
);

ALTER TABLE public.completion_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS completion_contacts_created_at_idx
  ON public.completion_contacts (created_at DESC);

-- Durable rate limiting for AI, checkout and simulation routes when Upstash is
-- not configured. One row per (route, user or IP) window; the function is the
-- only way in and is callable by the service role alone.

CREATE TABLE IF NOT EXISTS public.prep_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);

ALTER TABLE public.prep_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prep_rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO prep_rate_limits AS r (key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.count + 1 END,
        reset_at = CASE WHEN r.reset_at <= now() THEN now() + make_interval(secs => p_window_seconds) ELSE r.reset_at END
  RETURNING r.count INTO v_count;

  -- Opportunistic cleanup so the table stays small.
  IF random() < 0.01 THEN
    DELETE FROM prep_rate_limits WHERE reset_at < now() - interval '1 hour';
  END IF;

  RETURN v_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.prep_rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prep_rate_limit_hit(text, integer, integer) TO service_role;
