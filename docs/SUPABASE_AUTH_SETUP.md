# Supabase Auth — התחברות (מייל + Google)

## קישור התחברות במייל (Magic Link)

1. **Supabase** → Authentication → Providers → **Email** → Enable.
2. **URL Configuration** (אותו תפריט):
   - **Site URL**: `http://localhost:3000` (פיתוח) או כתובת הפרודקשן.
   - **Redirect URLs** — הוסיפו (לכל סביבה):
     - `http://localhost:3000/prep/auth/callback`
     - `https://YOUR-DOMAIN/prep/auth/callback`
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

## פתרון בעיות

| תסמין | פתרון |
|--------|--------|
| `provider is not enabled` | הפעילו Google ב-Supabase Providers |
| `redirect_uri_mismatch` (מ-Google) | הוסיפו `https://xxx.supabase.co/auth/v1/callback` ב-Google Console |
| חזרה ל-login עם `error=auth` | בדקו Redirect URLs ב-Supabase; בדקו ש-`NEXT_PUBLIC_APP_URL` נכון |
| Magic link לא מגיע | בדקו Email provider; ספאם; ב-Supabase אפשר SMTP מותאם |
