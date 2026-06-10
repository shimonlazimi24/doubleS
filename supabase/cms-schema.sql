-- ============================================================
-- PREPARE CMS — Content Management Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Modules (top-level course sections)
CREATE TABLE IF NOT EXISTS cms_modules (
  id            text PRIMARY KEY,
  title         text NOT NULL,
  sort_order    int  NOT NULL DEFAULT 0,
  published     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Lessons
CREATE TABLE IF NOT EXISTS cms_lessons (
  id                  text PRIMARY KEY,
  module_id           text REFERENCES cms_modules(id) ON DELETE SET NULL,
  title               text NOT NULL,
  kind                text NOT NULL DEFAULT 'text'
                        CHECK (kind IN ('text', 'video', 'mixed')),
  body_markdown       text,
  video_url           text,
  estimated_minutes   int  NOT NULL DEFAULT 10,
  sort_order          int  NOT NULL DEFAULT 0,
  published           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION cms_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cms_lessons_updated_at ON cms_lessons;
CREATE TRIGGER cms_lessons_updated_at
  BEFORE UPDATE ON cms_lessons
  FOR EACH ROW EXECUTE FUNCTION cms_set_updated_at();

-- Questions (for quizzes)
CREATE TABLE IF NOT EXISTS cms_questions (
  id                  text PRIMARY KEY,
  topic_slug          text NOT NULL,   -- vocabulary | sentence_completion | rephrasing | reading_comprehension
  subtopic_slug       text,
  prompt              text NOT NULL,
  options             jsonb NOT NULL,  -- [{ id: string, text: string }]
  correct_option_id   text NOT NULL,
  explanation         text,
  difficulty          int  NOT NULL DEFAULT 3
                        CHECK (difficulty BETWEEN 1 AND 6),
  published           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE cms_modules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_lessons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_questions ENABLE ROW LEVEL SECURITY;

-- Public SELECT on published rows
CREATE POLICY "cms_modules_public_read"   ON cms_modules   FOR SELECT USING (published = true);
CREATE POLICY "cms_lessons_public_read"   ON cms_lessons   FOR SELECT USING (published = true);
CREATE POLICY "cms_questions_public_read" ON cms_questions FOR SELECT USING (published = true);

-- Admin full access (is_admin = true in user_metadata)
CREATE POLICY "cms_modules_admin_all"   ON cms_modules   FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "cms_lessons_admin_all"   ON cms_lessons   FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "cms_questions_admin_all" ON cms_questions FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS cms_lessons_module_id  ON cms_lessons (module_id);
CREATE INDEX IF NOT EXISTS cms_lessons_published  ON cms_lessons (published);
CREATE INDEX IF NOT EXISTS cms_questions_topic    ON cms_questions (topic_slug);
CREATE INDEX IF NOT EXISTS cms_questions_published ON cms_questions (published);
