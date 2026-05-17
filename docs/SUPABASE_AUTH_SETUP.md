# Supabase Auth — התחברות (מייל + Google)

## קישור התחברות במייל (Magic Link)

1. **Supabase** → Authentication → Providers → **Email** → Enable.
2. **URL Configuration** (אותו תפריט):
   - **Site URL**: `http://localhost:3000` (פיתוח) או כתובת הפרודקשן.
   - **Redirect URLs** — הוסיפו (לכל סביבה):
     - `http://localhost:3000/prep/auth/complete`
     - `https://YOUR-DOMAIN/prep/auth/complete`
     - (אופציונלי, קישורים ישנים) `…/prep/auth/callback`
3. ב־`.env`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## Google OAuth

השגיאה `Unsupported provider: provider is not enabled` אומרת ש-**Google לא הופעל** ב-Supabase.

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**.
2. Create **OAuth client ID** → Application type: **Web application**.
3. **Authorized JavaScript origins** (אופציונלי לדפדפן):
   - `http://localhost:3000`
   - `https://YOUR-DOMAIN`
4. **Authorized redirect URIs** (חובה):
   - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`  
     (מוצאים ב-Supabase → Project Settings → API → Project URL, עם `/auth/v1/callback` בסוף)

### 2. Supabase — הפעלת Google

1. Authentication → **Providers** → **Google** → **Enable**.
2. הדביקו **Client ID** ו-**Client Secret** מ-Google.
3. שמרו.

### 3. Redirect URLs באפליקציה

ב-**Authentication → URL Configuration**, ודאו ש-**Redirect URLs** כולל:

```
http://localhost:3000/prep/auth/complete
https://YOUR-DOMAIN/prep/auth/complete
http://localhost:3000/prep/auth/callback
https://YOUR-DOMAIN/prep/auth/callback
```

### 4. הצגת כפתור Google באתר

ב־`.env` (אחרי שהפעלתם ב-Supabase):

```env
NEXT_PUBLIC_PREP_OAUTH_GOOGLE=1
```

בלי משתנה זה מוצגת רק התחברות במייל — כדי שלא יופיע כפתור שבור לפני ההגדרה.

### 5. בדיקה

1. `npm run dev`
2. פתחו `/prep/login`
3. «התחברות עם Google» → בחירת חשבון → חזרה ל־`/prep/amirant/course/dashboard` (או `returnTo`).

## מגבלת מיילים (Rate limit)

בפרויקט חדש / חינמי, Supabase שולח מעט מיילי Magic Link לשעה. אחרי בדיקות חוזרות תופיע:

`over_email_send_rate_limit`

**זה לא באג באתר** — השרת של Supabase מסרב לשלוח עוד מיילים.

**מה לעשות:**

1. **המתינו ~60 דקות** (או בדקו Authentication → Rate Limits בלוח)
2. **התחברות עם Google** (לא תלויה במייל)
3. **SMTP מותאם:** Project Settings → Authentication → [SMTP](https://supabase.com/docs/guides/auth/auth-smtp) (Resend / SendGrid וכו') — מעלה מכסה ומשפר מסירה
4. בפיתוח: אל תלחצו «שליחת קישור» עשרות פעמים ברצף

## פתרון בעיות

| תסמין | פתרון |
|--------|--------|
| `provider is not enabled` | הפעילו Google ב-Supabase Providers |
| `redirect_uri_mismatch` (מ-Google) | הוסיפו `https://xxx.supabase.co/auth/v1/callback` ב-Google Console |
| חזרה ל-login עם `error=auth` | בדקו Redirect URLs ב-Supabase; בדקו ש-`NEXT_PUBLIC_APP_URL` נכון |
| Magic link לא מגיע | בדקו Email provider; ספאם; ב-Supabase אפשר SMTP מותאם |
| `over_email_send_rate_limit` / «יותר מדי מיילים» | מגבלת Supabase (במיוחד בתוכנית חינמית: מעט מיילים לשעה). **גם ניסיונות שלא הגיעו למייל נספרים.** המתינו ~60 דק׳, השתמשו ב-Google, או הגדירו SMTP מותאם + Rate Limits |
| חוזרים לאתר אבל לא מחוברים | Redirect URLs חייבים לכלול `/prep/auth/complete`; מפתח **anon** מטאב Legacy (`eyJ…`), לא `sb_publishable_`; קישור חדש באותו דפדפן |
