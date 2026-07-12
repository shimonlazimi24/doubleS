# PREPARE — UX/UI Design Guidelines

> Source of truth for all UI work on this product. When a screen is reviewed or
> redesigned, it must comply with this document. Provided by the product owner.

## Role & Product Principle

Senior Product Designer / UX Architect for a professional English-learning
platform (adults, academic exam prep — Amirant/Amirnet now, TOEFL later).

The interface should feel like a **premium modern educational product built for
adults** — closer to a polished academic learning platform or a professional
exam-prep environment. It must NOT feel like: a children's app, a generic
AI-generated SaaS dashboard, a Tailwind template, or a collection of unrelated
cards. The design must create trust: *"This platform knows what I need to study,
where I am, and what I should do next."*

## Priorities (in order)
1. Comprehension → 2. Learning focus → 3. Clear next action →
4. Visual hierarchy → 5. Consistency → 6. Efficiency → 7. Aesthetic quality.
Never sacrifice usability or learning clarity for decoration.

## Core UX principles
- **One dominant purpose per screen.** Primary action understood in 2–3s.
- Always help the user answer: where am I / what am I learning / how much have I
  completed / what next / how am I performing / what to improve — but show the
  right info at the right moment, not all at once.
- **Design for long study sessions:** low visual noise, minimal animation,
  restrained color, comfortable line length, excellent typography, intentional
  whitespace, predictable controls, low cognitive load.

## Visual direction
Restrained, editorial, modern-academic. Mature, premium, precise, calm,
confident. Strong typography, subtle hierarchy, controlled spacing, clear
section boundaries, minimal-but-intentional color.

### Avoid
Indigo/purple as primary; large decorative gradients; glowing "AI" effects;
glassmorphism; excessive shadows; **every section inside a rounded white card**;
excessive pills/badges/progress widgets; giant rounded corners everywhere;
random illustrations; decorative icons/emoji; huge hero sections inside the
course; any element with no functional purpose. Do not create a typical
"AI SaaS" appearance.

### Cards
Cards only for a **meaningful independent object** (a course, a simulation, a
progress summary, a question group). NOT for every paragraph / heading / stat /
nav item / lesson section. Prefer layout, typography, spacing, dividers,
background changes, and grouping **before** introducing another card.

## Typography
Clear scale: page title / section title / lesson heading / body / supporting /
labels / question text / answer choices. Comfortable body size, strong
contrast, proper line height, max readable content width. Long educational text
never stretches across an excessively wide container.
**Bilingual RTL/LTR:** English preserves natural LTR; numbers, punctuation,
answer choices and inputs tested in mixed-direction scenarios; mixed content
must not appear broken.

## Course home
Not a dashboard of widgets. Purpose: resume and understand the journey.
1. **Continue learning** — most prominent; current lesson/module + progress +
   one obvious primary CTA. 2. **Course journey** — completed/current/upcoming
   (locked only if locking really exists); current position visually obvious.
3. **Progress & performance** — only useful metrics (overall progress, strongest
   topic, topic needing attention, recent improvement). No vanity metrics.

## Curriculum
Structured and intentional. Per module: clear title, short purpose/outcome,
progress state, meaningfully grouped lessons. Use human learning language, not
DB structure. Bad: "Module 4 — Unit 3 — Lesson Type B". Better: "Sentence
Completion — Learn how to identify the word that best completes the meaning."
Distinguish current/completed/upcoming without relying on color alone.

## Lesson page
Prioritize content. Structure: minimal contextual nav → lesson title → short
objective → main content → examples → practice when appropriate → Previous/Next.
Do **not** place the lesson inside a small floating card surrounded by empty
dashboard space — the content is the main product. Long lessons: meaningful
sections, subtle progress indicator, comfortable scrolling, minimal persistent
nav. Avoid distracting sidebars unless they add genuine value.

## Quiz
Focused and stable. The **question is always the strongest visual element**.
Answer choices: easy to scan, large hit areas, clear hover/focus/selected/
correct/incorrect states, never color-only. Do not reveal the correct answer
before submission. After answering, structured feedback: correct? → correct
answer → short explanation → learning insight. No massive celebration per
correct answer.

## Adaptive quiz
Do not expose algorithmic complexity (difficulty IDs, selection scores, rules).
Communicate meaning: "questions are adapting to your level" / "focusing more on
vocabulary". Never punish a difficulty decrease. Not "downgraded from Level 5 to
4" — instead "we adjusted the next questions to strengthen this skill".

## Exam simulation
Different from normal learning — concentration mode. Reduce nav/decoration/
analytics/menus. Prioritize timer, section, question progress, question,
answers, controls. Before start: number of questions, time, rules, whether
answers can change. At completion: overall result + performance by topic + key
weaknesses + recommended next action (never a meaningless score screen).

## Analytics
Answer "what should I do differently?". Prioritize progress over time,
performance by skill, weak areas, recent trend, recommended practice. Avoid
dense BI dashboards, too many graphs, jargon, uninterpreted stats. Every metric
has context: not "Vocabulary: 68%" but "Vocabulary — 68% — Improving, but
advanced word meaning is still your main weakness."

## States
- **Empty:** what's missing, why, what to do next (no bare "No data").
- **Loading:** skeletons matching real structure; no full-screen spinners for
  small updates; no layout jump; no fake progress %.
- **Error:** human and actionable; no stack traces / API / DB / raw codes;
  say what happened, whether progress is safe, what to do.

## Responsive & Accessibility
Deliberately design desktop/tablet/mobile (don't just let CSS wrap). Check nav,
answer choices, long English sentences, mixed RTL/LTR, tables, progress, timers,
sticky controls, bottom nav, modals. Mobile: primary actions reachable, avoid
excessive sticky elements, don't shrink desktop into miniature.
Accessibility is design, not later QA: strong contrast, visible keyboard focus,
semantic HTML, labels, keyboard nav, screen-reader-friendly controls, adequate
touch targets, state not via color alone, reduced-motion support.

## Interaction & Design System
Animation only to clarify state/orientation and feel fast — never merely to look
"modern". Avoid excessive entrance animations, slow/bouncy transitions,
constant floating UI, animated gradients.
Before new patterns: check existing component/tokens; reuse or improve the
shared one; don't create one-offs. One product, not independently designed
pages. Consistency across buttons, inputs, tabs, nav, cards, progress, status,
options, feedback, dialogs, tooltips.

## Simplicity, Navigation & Learning Flow
Simple even when the system is complex; the learner never needs to understand
the platform to use it. Avoid too many nav options / competing actions / deep
menus / repeated info / unnecessary dashboards. Prefer one clear primary action,
predictable navigation, familiar patterns, consistent structure, progressive
disclosure.

The course is **one continuous journey**: Home → Module → Lesson → Practice →
Feedback → Next Lesson → Module Completion → Next Module. **No dead ends** —
every page has a logical next step. Never force a manual return to the homepage
after every lesson.

Navigation answers: where am I / what's around me / where next.
- **Current location** via title + module context + lesson progress (not
  breadcrumb alone), visible but not dominant.
- **Between lessons:** easy Previous/Next; **Next is more prominent** and names
  the destination — "Next: Choosing the Best Answer", not vague "Next".
- **End of lesson:** confirm complete → show what was achieved → next
  recommended step → easy continuation; secondary "Back to module".
- **Module nav (desktop):** restrained compact sidebar / collapsible list /
  outline drawer showing completed/current/upcoming; current unmistakable; don't
  oversize it and steal content area. **Mobile:** compact outline button →
  slide-over/bottom-sheet; clear prev/next; lightweight progress.
- **Course outline** supports direct navigation — don't force home → module →
  find → open just to reach a nearby lesson.
- **Resume:** always easy; persist current lesson, completion, quiz progress,
  module, unfinished activity.
- **Back button** behaves logically; no lost progress; no history spam from quiz
  nav; no modal traps.

## Decision standard (before approving any decision)
Is it clearer? Easier to use? Lower cognitive load? Better for learning? Does it
fit the rest of the product? Professional for an adult learner? Is the element
actually necessary? If no → remove or redesign.

## Final quality bar
Not just "cleaner / more modern / better spaced" — a coherent premium
educational product. The user should feel: *I understand where I am. I know what
to do. I can focus. I trust this platform. I want to continue learning.* Always
prefer a restrained, intentional, professional solution over an impressive but
noisy one.
