# prePare — הכנה למבחני אנגלית

אפליקציית Next.js **נפרדת** לחלוטין מ־**Paza** (ניהול תורים). הפרויקט יושב בתיקייה משלו: `education`.

## פיתוח

```bash
cd ~/education
npm install
cp .env.example .env
npm run dev
```

## משתני סביבה

- `NEXT_PUBLIC_APP_URL` — כתובת ציבורית (מטא־דאטה, OG)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Auth
- `NEXT_PUBLIC_PREP_OAUTH_GOOGLE=1` — כפתור Google (רק אחרי הפעלה ב-Supabase; ראו `docs/SUPABASE_AUTH_SETUP.md`)
- `PREP_AUTH_BYPASS=1` — רק לפיתוח (לא production): דילוג על אימות בנתיבים מוגנים
- `NEXT_PUBLIC_SCHEDULING_SITE_URL` — אופציונלי, קישור לאתר תורים חיצוני

## פריסה (Vercel)

פרויקט **נפרד** מ־Paza. ב־Vercel: Root Directory = שורש התיקייה `education` (או הנתיב המלא לריפו אם העלית רק אותה).

## מבנה

- `/prep/*` — שיווק ולמידה
- `src/lib/prep/supabase/middleware.ts` — רענון סשן Supabase במידלוור
- `docs/SUPABASE_AUTH_SETUP.md` — magic link + Google OAuth ב-Supabase
- `docs/PRODUCTION_READINESS.md` — env vars, migrations, RLS, Sentry, E2E
- `docs/AMIRANT_RELEASE_CHECKLIST.md` — release gates (pass/fail)
- `docs/RAG_OPERATIONS.md` — pgvector + embeddings ops
- `SECURITY_SETUP.md` — secrets hygiene + rotation checklist
