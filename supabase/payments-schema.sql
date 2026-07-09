-- ============================================================
-- prep_payments - יומן תשלומים (Hyp) + אידמפוטנטיות הענקת גישה
-- להריץ ב-Supabase SQL Editor אחרי amirant-production-mvp-schema.sql
-- ============================================================

create table if not exists prep_payments (
  id uuid primary key default gen_random_uuid(),
  -- הערך שנשלח ל-Hyp בשדה Order (אקראי, לא מכיל זהות)
  order_ref text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null check (plan_id in ('week','two_weeks','month','ext_week','ext_two_weeks','ext_month')),
  amount_nis numeric(8,2) not null,
  currency text not null default 'ILS',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','cancelled','refunded')),
  -- Id מהקולבק של Hyp (מזהה עסקה)
  hyp_transaction_id text,
  -- ACode - קוד אישור מחברת האשראי
  hyp_acode text,
  -- CCode - קוד תשובה גולמי (0 = הצלחה)
  hyp_ccode text,
  -- כל פרמטרי הקולבק המאומתים (לאודיט ותמיכה)
  raw_callback jsonb,
  -- מה הוענק בפועל
  entitlement_ends_at timestamptz,
  -- שיוך קמפיינים (utm_* שנלכדו בזמן הרכישה)
  utm jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists prep_payments_user_created on prep_payments (user_id, created_at desc);
create index if not exists prep_payments_status on prep_payments (status, created_at desc);

alter table prep_payments enable row level security;

-- קריאה: המשתמש רואה רק את התשלומים של עצמו
drop policy if exists prep_payments_own_select on prep_payments;
create policy prep_payments_own_select on prep_payments
  for select to authenticated using (user_id = auth.uid());

-- כתיבה: אין policies - service role בלבד (checkout + callback רצים בשרת)

-- ============================================================
-- הענקת ימי גישה אטומית - מונעת מרוץ בין שני קולבקים מקבילים
-- (שתי רכישות/הארכות בו-זמנית): ההארכה מחושבת ב-DB בשורה נעולה,
-- כך ששתי הענקות מצטברות במקום שהאחרונה תדרוס את הראשונה.
-- ============================================================
create or replace function grant_course_days(
  p_user_id uuid,
  p_course_slug text,
  p_days int
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ends_at timestamptz;
begin
  insert into course_entitlements (user_id, course_slug, access_type, starts_at, ends_at)
  values (p_user_id, p_course_slug, 'paid', now(), now() + make_interval(days => p_days))
  on conflict (user_id, course_slug) do update
    set access_type = 'paid',
        ends_at = greatest(coalesce(course_entitlements.ends_at, now()), now())
                  + make_interval(days => p_days)
  returning ends_at into v_ends_at;
  return v_ends_at;
end;
$$;

-- service role בלבד - לא חשוף למשתמשים
revoke execute on function grant_course_days(uuid, text, int) from public;
revoke execute on function grant_course_days(uuid, text, int) from anon;
revoke execute on function grant_course_days(uuid, text, int) from authenticated;
