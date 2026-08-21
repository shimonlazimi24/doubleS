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

-- ============================================================
-- אחסון סרטונים שמועלים מהאדמין
-- ============================================================
-- הקובץ עולה מהדפדפן ישירות ל-Storage ולא דרך השרת: לפריסה ב-Vercel יש
-- תקרת גוף בקשה של ~4.5MB, שכל סרטון סביר חורג ממנה.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  524288000, -- 500MB
  array['video/mp4','video/webm','video/quicktime','video/x-m4v']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- קריאה: ציבורית (הסרטון מוצג לכל מבקר).
drop policy if exists site_media_public_read on storage.objects;
create policy site_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

-- כתיבה/מחיקה: אדמין בלבד, לפי app_metadata (לא user_metadata - אותו נימוק
-- כמו בכל שאר השערים: משתמש יכול לכתוב לעצמו user_metadata).
drop policy if exists site_media_admin_write on storage.objects;
create policy site_media_admin_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists site_media_admin_update on storage.objects;
create policy site_media_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists site_media_admin_delete on storage.objects;
create policy site_media_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
