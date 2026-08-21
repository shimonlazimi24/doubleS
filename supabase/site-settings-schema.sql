-- ============================================================
-- prep_site_settings - הגדרות אתר שנערכות מהאדמין (לא תוכן שיעור)
-- להריץ ב-Supabase SQL Editor.
-- ============================================================

create table if not exists prep_site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table prep_site_settings enable row level security;

-- קריאה: ציבורית. הערכים כאן הם תוכן שמוצג לכל מבקר (למשל כתובת סרטון),
-- והדפים שמציגים אותם נטענים בשרת גם למשתמשים אנונימיים.
drop policy if exists prep_site_settings_public_read on prep_site_settings;
create policy prep_site_settings_public_read on prep_site_settings
  for select to anon, authenticated using (true);

-- כתיבה: אין policy - service role בלבד, דרך /api/prep/admin/settings
-- שמאמת app_metadata.is_admin לפני כל שמירה.

insert into prep_site_settings (key, value)
values ('videos', '{}'::jsonb)
on conflict (key) do nothing;
