# prePare (getPrepare) — סקירת סניור מלאה

**פרויקט:** `/Users/shimonlazimi/getPrepare/doubleS`  
**מוצר:** PREPARE — הכנה לאמירנט · https://getprepared.academy  
**תאריך:** אוגוסט 2026  

**היקף:** ארכיטקטורה · פלואו · פרפורמנס · באגים · איכות קוד · איטרציות מיותרות · UX/UI אנושי · אדמין · פרומפטים · אבטחה

> `doubleS-main` = snapshot ישן. הסקירה על **`doubleS` בלבד**.

---

## סטטוס יישום (אוג׳ 2026)

**בקוד (סומן כסגור):** ATO verify · CMS RLS SQL · chunks restrict SQL · grade API (בנק+דמו) · `questions.public.json` · מפתחות מחוץ לקליינט · AI routes נעולים · admin upsert · XSS/markdown · timer · toasts · CTA/copy · מנעולי מודול · onboarding 3 שלבים · footer מוסתר בקורס · access poll · chat rAF · barrel בלי בנק מפתחות · מחיקת LearningService / shells מתים · tokens מיושרים יותר.

**ידני אצלך ב-Supabase (חובה לפני פרוד):**
1. `supabase/migrations/20260817_cms_rls_app_metadata.sql`
2. `supabase/migrations/20260817_restrict_course_chunks.sql`

**לא פוצל בכוונה (חודש / ניקיון גדול):** פיצול god-files מלא של quiz/lesson — סיכון רגרסיה גבוה בלי שינוי מוצר.

---

## סיכום מנהלים

המוצר עובד מקצה לקצה ויש בו מחשבה אמיתית על למידה (הקדמה חינם, NBA, staged hints).  
מה שפוגע בתחושה האנושית ובאמינות: **הבטחות שבורות ב-CTAs**, **פרומפטי מערכת שנשפכים לצ'אט**, **שמירות שנבלעות בשקט**, **אדמין שביר**, ו**בנק שאלות שלם בדפדפן**.

| תחום | ציון |
|------|------|
| Product / flow | 7.5 / 10 |
| UX אנושי (לומד) | 5 / 10 |
| Admin | 3.5 / 10 |
| Performance | 5 / 10 |
| Code human-readable | 5.5 / 10 |
| Bugs / reliability | 4.5 / 10 |
| Prompts / RAG | 7 / 10 |
| Security | 3.5 / 10 |

**שבוע ראשון מומלץ:** ATO + CMS RLS + timer bug + לא להציג system prompts + upsert באדמין + toast על כשל שמירה.

---

## 1. פלואו מוצר (לומד)

```
/prep → login → onboarding (6 שלבים) → pricing / Hyp
  → entitlements → /prep/amirant/course
      שיעור | quiz | סימולציה | weak-quiz | AI chat | dashboard
```

### מה טוב
- `amirant-continue` מסודר: login → onboarding → pricing → course
- Intro חינם מכוון
- Placement לפני טיימר — נכון
- NBA (Next Best Action) נותן כיוון

### חיכוכים / צעדים מיותרים
| בעיה | למה זה מעיק |
|------|-------------|
| 6 שלבי onboarding לפני למידה | “איך שמעת עלינו” לא עוזר ללומד |
| מסך סיום: “קדימה לתרגול!” ואז ממשיכים ל-pricing | הבטחה שבורה |
| `/prep` ו-`/prep/amirant` מוכרים אותו סיפור פעמיים | כפילות |
| Google splash לפני OAuth | קפיצה מיותרת |
| שערי בדיקה כל ~2 סקשנים בשיעור | מרגיש כמו ביקורת, לא ליווי |
| 3 CTAs בתוצאות placement | אין “צעד אחד ברור” |
| Dashboard header CTA + כרטיס NBA | אותה שאלה פעמיים |
| מודולים נראים פתוחים בלי מנעול → redirect ל-pricing | הפתעה קרה |

---

## 2. UX / UI — שיהיה אנושי

### ציון תחושה אנושית

| ממד | ציון | הערה |
|-----|------|------|
| חום בעברית (שיווק/onboarding) | 7/10 | טוב כשהטקסט כתוב ידנית |
| כנות CTAs | 4/10 | “מלא”, “תוכנית אישית”, “קדימה לתרגול” |
| רוגע בשיעור | 5/10 | מבנה טוב; gates + AI פנימי שוברים אמון |
| אחידות ויזואלית | 4/10 | 3 שפות עיצוב |

### שלוש שפות עיצוב (בעיה)
1. Marketing / tokens — paper כחול-לבן אקדמי  
2. Lesson SaaS — `gray/slate` + לבן (`lesson-saas-tokens`)  
3. Dashboard — navy/gold ב-hex קשיח  

### קול מערכת שנשפך למשתמש (לא אנושי)
- `LessonAiCoachBlock` / QuickCheck שולחים לצ'אט הוראות RAG מלאות (“התבסס רק על RAG…”)
- שגיאות באנגלית: `Rate limit exceeded`, `Invalid body`
- “מיקוד: שיעור בדף זה (הקשר מדויק).” — קול מהנדס
- Login: “תועברו ל־/prep/…” — חושף נתיבים

### מובייל
- Header קורס עם 3 לינקים — נדחס
- Footer שיווקי גם בתוך הקורס + FAB + sticky footer שיעור — חפיפה
- Stepper מובייל: מספרים בלי הקשר

### המלצות UX אנושי (לפי עדיפות)

**P0**
1. אף פעם לא להציג system/RAG prompts בצ'אט — רק “תסביר לי את החלק הזה”
2. ליישר copy של סיום onboarding עם היעד האמיתי (pricing מול תרגול)
3. מנעולים על מודולים בתכנית הלימודים + הסבר חם
4. Toast כששמירה נכשלת
5. CTA אחד בתוצאות placement

**P1**
6. לכבד `?next=` דרך checkout  
7. לקצר onboarding ל-3 שאלות לומד  
8. לחכות ל-`progress.ready` (בלי פלאש 0%)  
9. להסתיר footer שיווקי בתוך הקורס; nav מובייל קומפקטי  
10. לתרגם שגיאות API לעברית בגבול ה-UI  
11. “מאמן” / “שאלו אותי על השיעור” במקום “מיקוד…”

**P2**
12. לאחד hub `/prep/amirant` עם הבית או CTAs כנים  
13. Design tokens אחד לכל המוצר  
14. Dual-write progress ל-local אחרי login  
15. Poll entitlement אחרי תשלום  
16. gates בשיעור — דלג או פחות  
17. FAB vs footer — אזור פעולה אחד במובייל  

---

## 3. אדמין (`/prep/admin`)

### מה יש
- Dashboard + שיעורים + שאלות  
- עברית / RTL בסיסי  
- Override על body/video של שיעורי manifest  

### ציון אדמין: 3.5 / 10

| אזור | ציון | הערה |
|------|------|------|
| כיסוי דפים | 6/10 | מספיק בסיסי |
| Auth באפליקציה | 8/10 | `app_metadata` נכון |
| Auth ב-DB (RLS) | 2/10 | `user_metadata` — מסוכן |
| אמינות שמירת שיעור | 3/10 | PATCH שקט / unpublish |
| ערך שאלות CMS | 2/10 | לא מחובר ל-quizzes חיים |
| Ops יומיומי | 3/10 | אין outline create, RAG refresh, תלמידים |

### באגים / מלכודות אדמין

| חומרה | בעיה |
|-------|------|
| Critical | RLS על `user_metadata.is_admin` במקום `app_metadata` |
| Critical | שאלות מפורסמות חושפות `correct_option_id` ב-SELECT ציבורי |
| High | עריכה ראשונה של שיעור manifest → PATCH על 0 שורות → “הצלחה” בלי שמירה |
| High | “שמור טיוטה” כופה `published: false` = מבטל פרסום בלי אישור |
| High | Delete בלי בדיקת `res.ok` — ניווט החוצה גם אם נכשל |
| Medium | Preview markdown עם `dangerouslySetInnerHTML` בלי escape |
| Medium | `module_id`: `mod-intro` מול `intro` מול FK בלי seed |
| Medium | שאלות CMS לא נכנסות לבנק החי — עבודה לשווא |

### חסר ליום-יום
- יצירת שיעור חדש ב-outline (`getAllCmsLessons` לא בשימוש)  
- סידור מודולים ב-UI  
- חיבור שאלות CMS ל-quizzes  
- Reindex RAG אחרי publish  
- ניהול entitlements / תלמידים  
- Toast הצלחה / dirty leave warning  
- Preview באותו renderer כמו התלמיד  

### המלצות אדמין
**P0:** RLS → `app_metadata` · upsert בשמירה · לא לחשוף answer keys · להפריד “שמור” מ-“בטל פרסום”  
**P1:** toasts · יישור module ids · renderer אחיד · Zod + `requirePrepAdmin` משותף · להחביא שאלות CMS עד שיחוברו  
**P2:** outline create · RAG refresh · students · עיצוב אחיד עם המוצר  

---

## 4. באגים (לומד + מערכת)

| חומרה | באג | מיקום |
|-------|-----|--------|
| Critical | ATO ב-auth verify (service-role fallback) | `prep/auth/verify` |
| Critical | Adaptive quiz: `setInterval` תלוי ב-`timeLeftSec` → נוצר מחדש כל שנייה | `AmirantAdaptiveQuizClient.tsx` |
| High | Persist נבלע: `.catch(() => {})` | Adaptive / Placement / Simulation |
| High | Side-effect בתוך `setState` (save) — Strict Mode double-save | `AmirantCourseProgressProvider.tsx` |
| High | `pricing?next=` לא נקרא | `PrepPricingPage.tsx` |
| High | Curriculum בלי מנעולים — redirect מפתיע | `AmirantCurriculumHub` |
| High | פלאש 0% לפני hydrate | hub + progress |
| High | Onboarding 401 → “הצלחה” מקומית → loop | wizard |
| High | Coach prompts גלויים למשתמש | `LessonAiCoachBlock` |
| High | `markLessonCompleted` גם ב-revisit | `PremiumLessonWorkspace` |
| Medium | Simulation timer race עם `finishSection` ב-deps | Simulation client |
| Medium | Access provider חד-פעמי — race אחרי תשלום | access provider |
| Medium | E2E adaptive: כפתור “בקשת ניתוח” vs UI חדש | `tests/e2e` |
| Medium | Content mode: bank production / package demo — מבלבל | `resolved-content.ts` |

---

## 5. פרפורמנס

| חומרה | בעיה |
|-------|------|
| P0 | ~2.5MB JSON (שיעורים+שאלות+RAG) + `correctOptionId` ב-client |
| P0 | Barrel `@/lib/amirant-course` מושך את כל הבנק |
| High | N+1: `uploadAmirantProgressLessons` upsert לכל שיעור בטור |
| High | Chat: `setMessages` על כל טוקן → re-render סערה |
| High | 3 providers בקורס כל אחד עושה `getUser()` |
| High | Adaptive timer thrash (למעלה) |
| Medium | Admin CMS lists בלי pagination |
| Medium | AI routes פתוחים → עלות |

---

## 6. קוד אנושי + איטרציות מיותרות

### Dead / כפול
- `LearningService` (~604 שורות) — **לא נקרא אף פעם**
- סכמות `learning-intelligence` / `adaptive-learning` — לא בשימוש מוצרי
- שני `LessonHeader` (ישן מת / חדש חי), `LessonHero`, `LessonPageHeader` מתים
- שני `LessonCard`
- `AmirantCourseLandingPage` נראה orphan
- שאלות CMS מקבילות לבנק מיובא — בלי payoff

### God files
| שורות | קובץ |
|------:|------|
| 852 | `AmirantPracticeFlow.tsx` (דמו) |
| 696 | `PremiumLessonWorkspace.tsx` |
| 634 | `AmirantAdaptiveQuizClient.tsx` |
| 614 | `PrepOnboardingWizard.tsx` |
| 482 | `AmirantCourseSimulationClient.tsx` |
| 463 | `AmirantPlacementQuizClient.tsx` |

שלושה מנועי quiz כמעט-כפולים (Adaptive / Placement / Simulation / Demo).

### Refactors לקוד אנושי
1. persistence אחד: `amirant_*` — למחוק/להעביר LI ל-`docs/future`
2. `useQuizTimer` משותף (deps = phase בלבד)
3. לפצל quiz gods: `useQuizAttempt` / `useQuizPersist` / Results / Shell
4. לפצל `PremiumLessonWorkspace`
5. למחוק lesson shells מתים
6. לא side-effects ב-`setState`
7. batch progress upload
8. barrels צרים — bank רק בנתיב מפורש
9. analytics: Supabase ל-logged-in; local = cache
10. chat: buffer טוקנים ל-rAF / 50ms

---

## 7. פרומפטים / RAG (תזכורת)

**חזק:** staged hints, עברית, logistics guard, numeric safety, SSE.  
**חלש:** base מאפשר tutoring כללי מול “ONLY context”; citations מזויפים (top-3); chunking גס (שיעור שלם עד 10k); שאלות בלי `lessonId`.

---

## 8. אבטחה (תזכורת)

| Critical | ATO ב-verify · CMS RLS `user_metadata` |
| High | chunks פתוחים · completion-contact · AI בלי auth · answer keys ב-client · PREP_AUTH_BYPASS ב-preview |
| Medium | markdown XSS · prompt injection · rate-limit in-memory |

---

## תוכנית עבודה משולבת

### שבוע 1 — אמון + יציבות
1. לתקן ATO ב-verify  
2. CMS RLS → `app_metadata`  
3. Adaptive timer deps  
4. להסתיר system prompts מהצ'אט  
5. Admin upsert + לא unpublish ב“טיוטה”  
6. Toast על כשל persist  

### שבוע 2–3 — אנושיות + ביצועים
7. מנעולים + copy כנה (onboarding/pricing/CTAs)  
8. שאלות server-side / בלי answer keys ב-client  
9. N+1 progress · memo providers · chat buffer  
10. לקצר onboarding · CTA אחד בתוצאות  
11. Admin toasts + module ids + להחביא questions CMS  

### חודש — ניקיון ארכיטקטוני
12. למחוק LearningService + סכמות מתות  
13. לפצל god files · lesson shells מתים  
14. איחוד design tokens  
15. e2e ב-CI · Zod על admin  
16. chunking עדין + מדיניות grounding אחת  
17. ארכוב `doubleS-main`  

---

## שורה תחתונה

לא חסר “עוד פיצ'רים” — חסר **כנות מול הלומד**, **אמינות שמירה**, **אדמין שלא משקר**, ו**קוד בלי כפילויות**.  
כשתתקנו את השכבה הזו, המוצר כבר מרגיש כמו מוצר אנושי חזק — כי הבסיס הפדגוגי קיים.

---

## מסמכים / Canvas
- קובץ זה: `docs/senior-system-review-2026-08.md`
- Canvas: canvases בפרויקט Cursor של doubleS
