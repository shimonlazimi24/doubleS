import type { User } from "@supabase/supabase-js";

/**
 * בדיקת אדמין אחת לכל השערים (middleware, layout, API).
 *
 * חשוב: `app_metadata` בלבד — את `user_metadata` כל משתמש יכול לכתוב לעצמו
 * דרך `supabase.auth.updateUser({ data: ... })` עם ה-anon key, ולכן בדיקה
 * עליו מאפשרת לכל תלמיד להפוך את עצמו לאדמין.
 *
 * הענקת אדמין (SQL Editor ב-Supabase, service בלבד):
 *   update auth.users
 *   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'
 *   where email = 'you@example.com';
 */
export function isPrepAdminUser(user: User | null | undefined): boolean {
  return user?.app_metadata?.is_admin === true;
}
