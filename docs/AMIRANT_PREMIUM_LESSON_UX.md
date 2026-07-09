# Amirant premium lesson UX (2026 EdTech-style)

## 1. New component structure

| Component | Path | Role |
| --- | --- | --- |
| `PremiumLessonShell` | `src/components/prep/amirant-course/lesson/PremiumLessonShell.tsx` | Desktop: sticky sidebar + main; mobile: stepper rail above content |
| `LessonHero` | `src/components/prep/amirant-course/lesson/LessonHero.tsx` | Re-export of `LessonHeader` (hero: title, 2-line intro, time, path progress bar, **התחל שיעור**) |
| `LessonHeader` | `…/LessonHeader.tsx` | Same as hero implementation |
| `LessonProgressStepper` | `…/LessonProgressStepper.tsx` | Vertical steps (desktop) / compact bar (mobile) from the flow |
| `LessonMicroSection` | `…/LessonMicroSection.tsx` | Alias of `LessonBlockCard` |
| `LessonInsightCard` / `LessonExampleCard` / `LessonTipCard` / `LessonWarningCard` / `LessonKeyTakeawayCard` / `LessonCommonMistakeCard` | `…/LessonVariantCards.tsx` | Typed wrappers |
| `LessonQuickCheck` | `…/LessonQuickCheck.tsx` | Binary professional check: **הבנתי, להמשיך** / **צריך הסבר נוסף** (→ RAG chat) |
| `LessonAiCoachBlock` | `…/LessonAiCoachBlock.tsx` | Coach actions with prefilled prompts (explain, summarize, example, 2 drills, open chat) |
| `LessonFooterActions` | `…/LessonFooterActions.tsx` | Alias of `LessonFooterCTA` (תרגול, מבחן, שיעור הבא) |
| `AmirantPremiumLessonView` | `src/components/prep/amirant-course/premium/AmirantPremiumLessonView.tsx` | Composes shell, stepper, flow, gates, footer, coach |

## 2. How old lesson blocks map to the new UI

- **Registry `ContentBlock`** → `contentBlocksToPremiumFlow` → `LessonBlockCard` / `LessonMicroSection` with variant (intro→explanation, examples→example, summary→key-takeaway, callout→tip/warning/**insight** for `info`).
- **Markdown `##` sections** → `splitMarkdownIntoSections` + `guessSectionVariant` → same card model.
- **Gates (every ~2 sections)** → `LessonQuickCheck` (not scored).
- **Long markdown body** → `splitBodyIntoMicroParts` → several visual “חלק x/y” strips **inside one card** (paragraph boundaries only; wording unchanged).

## 3. AI integration (existing `lesson-chat` + RAG)

- `src/lib/prep/amirant-lesson-coach-events.ts` - `window` event `amirant:course:coach-prompt` with `{ userMessage, autoSend? }`.
- `AmirantCourseChatPanel` listens, prefills input, optionally auto-sends; `AmirantCourseFloatingChat` opens the panel on the same event.
- Prompts in `LessonAiCoachBlock` stress: **course RAG only**, no invented exam facts, short actionable answers.
- `LessonQuickCheck` “צריך הסבר נוסף” sends a grounded help request with `autoSend: true`.

## 4. Example: Unit 1 (Introduction module)

- Module: `mod-intro` → e.g. [`/prep/amirant/course/lesson/lesson.intro.doc-1-1`](https://localhost) - “ברוכים הבאים לקורס”.
- Flow: hero with progress bar → stepper (sections + בדיקה קצרה) → micro cards → “מה חשוב לזכור” → footer actions → מאמן AI.

## 5. Files changed (this iteration)

- **Added:** `PremiumLessonShell.tsx`, `LessonProgressStepper.tsx`, `LessonQuickCheck.tsx`, `LessonAiCoachBlock.tsx`, `LessonHero.tsx`, `LessonMicroSection.tsx`, `LessonFooterActions.tsx`, `amirant-lesson-coach-events.ts`, `microsection-split.ts`, `microsection-split.test.ts`
- **Updated:** `AmirantPremiumLessonView.tsx`, `LessonHeader.tsx`, `LessonBlockCard.tsx` (bodyParts), `AmirantCourseChatPanel.tsx`, `AmirantCourseFloatingChat.tsx`, `LessonInteraction.tsx` (re-export), `LessonVariantCards.tsx`, `lesson/index.ts`
- **Tests:** `npm run test:amirant` - the suite may still report failures in `content-source/import.test.ts` (production JSON schema / empty `items` on examples blocks) unrelated to this UX work; the new `microsection-split` tests pass in isolation.

## 6. Commands

```bash
npx tsc --noEmit
npx vitest run --config vitest.config.mts src/lib/amirant-course/lesson-content/microsection-split.test.ts
npm run test:amirant
```
