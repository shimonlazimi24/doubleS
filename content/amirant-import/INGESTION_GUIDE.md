# Amirant Content Ingestion Guide

This guide explains how to add real Amirant content into the production ingestion layer.

## Where to author content

- Templates for writers: `content/amirant-import/templates/*`
- Ingestion schemas/pipeline:
  - `src/lib/amirant-course/content-source/schemas.ts`
  - `src/lib/amirant-course/content-source/import.ts`
  - `src/lib/amirant-course/content-source/coverage.ts`
- Production source seed:
  - `src/lib/amirant-course/content-source/production-source.ts`

## How to add a lesson

1. Copy `lesson.template.json`.
2. Fill:
   - `moduleSlug`
   - `lessonId`
   - `lessonTitle`
   - `contentBlocks` (intro/explanation/examples/summary)
   - `transcriptOrAudioNotes`
   - `aiRetrievalText`
3. Ensure all text blocks are non-empty and valid JSON.

## How to add questions

1. Copy `question-item.template.json`.
2. Fill:
   - `topic`
   - `subtopic`
   - `difficultyLevel` (**must be 1–6**)
   - `questionText`
   - 4 options
   - `correctOptionId`
   - `explanation`
   - `distractorExplanations`
   - `estimatedTimeSec`
3. Every question must include explanation text.

## Topic / subtopic / difficulty tagging rules

- Topics must be one of:
  - `vocabulary`
  - `sentence_completion`
  - `rephrasing`
  - `reading_comprehension`
- `subtopic` must be explicit and stable (slug-like).
- `difficultyLevel` must be integer 1–6.

## Practice sets

Use `practice-set.template.json`:
- define `topic`
- set `difficultyRange.min/max`
- set `numberOfQuestions`
- set `timeLimitSec`

The importer derives `questionIds` from the validated bank by topic + difficulty range.

## Simulations

Use `simulation-section.template.json` with:
- `scoringMode` = `pilot` or `scored`
- `questionCount`
- `timeLimitSec`
- `adaptiveRules`

## Running coverage matrix utility

Use `buildAmirantCoverageMatrix(...)` from:
- `src/lib/amirant-course/content-source/coverage.ts`

It outputs:
- status rows (`implemented` / `placeholder` / `missing`)
- counts by topic/subtopic/difficulty
- required minimums
- gap counts

CLI output (JSON):

```bash
npm run coverage:amirant-content
```

## Production-ready checklist

Content is production-ready only when:

1. `meta.readiness` in `production-source.ts` is set to `production_ready`
2. all source payloads pass Zod validation
3. question bank has:
   - explanations for all items
   - difficulty in 1–6
4. coverage gaps are zero or accepted by pedagogy review
5. manual pedagogical review is completed

## Source separation policy

- Production source is explicit (`sourceKind = production`).
- Demo fallback remains generated bank/registry/sim definitions.
- Runtime never mixes silently: it selects production only when validated + ready.
