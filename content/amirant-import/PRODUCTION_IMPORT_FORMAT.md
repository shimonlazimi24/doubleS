# Amirant Production Import Format

This document defines a production content format that writers/editors can fill directly.
It is aligned with the current course architecture in `src/lib/amirant-course/*` and is designed
to be imported into DB/CMS later (instead of hardcoded TypeScript content).

Authoring source files live in:

- `content/amirant-import/source/lessons.json`
- `content/amirant-import/source/questions.json`
- `content/amirant-import/source/practice-sets.json`
- `content/amirant-import/source/simulations.json`
- `content/amirant-import/source/ai-retrieval.json`
- `content/amirant-import/source/syllabus-mapping.json`

## 1) Lesson Content Template

Use one JSON object per lesson.

```json
{
  "courseSlug": "amirant-preparation",
  "moduleSlug": "introduction",
  "lessonId": "intro-exam-look",
  "lessonTitle": "איך נראה מבחן האמירנט",
  "lessonKind": "text",
  "estimatedMinutes": 20,
  "contentBlocks": [
    {
      "type": "intro",
      "title": "פתיחה",
      "body": "סקירה קצרה של מבנה המבחן."
    },
    {
      "type": "explanation",
      "title": "הסבר",
      "body": "פירוט על פרקי אמת, פיילוט ואדפטיביות."
    },
    {
      "type": "examples",
      "title": "דוגמאות",
      "items": [
        "פרק פיילוט לא נספר לציון",
        "רמת הקושי משתנה לפי ביצועים"
      ]
    },
    {
      "type": "summary",
      "title": "סיכום",
      "bullets": [
        "להכיר את ממשק הטיימר",
        "להבין מה נמדד ומה לא נספר לציון"
      ]
    }
  ],
  "transcriptOrAudioNotes": {
    "transcriptText": "טקסט מלא של ההדרכה/אודיו",
    "audioNotes": [
      "דגשים להקלטה 1",
      "דגשים להקלטה 2"
    ]
  },
  "aiRetrievalText": "טקסט נקי, רציף ומלא לשימוש RAG/חיפוש סמנטי (ללא HTML).",
  "source": {
    "sourceDocName": "amirant_full_syllabus.docx",
    "owner": "content-team",
    "version": "v1.0"
  }
}
```

## 2) Question Bank Item Template

Use one JSON object per question.

```json
{
  "courseSlug": "amirant-preparation",
  "questionId": "vocab-0001",
  "topic": "vocabulary",
  "subtopic": "vocab-academic-register",
  "difficultyLevel": 4,
  "questionType": "single_choice",
  "questionText": "Choose the best word for formal academic writing.",
  "options": [
    { "id": "a", "label": "substantiate" },
    { "id": "b", "label": "decorate" },
    { "id": "c", "label": "ignore" },
    { "id": "d", "label": "borrow" }
  ],
  "correctOptionId": "a",
  "explanation": "Academic register requires precise, neutral wording.",
  "distractorExplanations": {
    "b": "Semantically off-task",
    "c": "Contradicts the prompt",
    "d": "Contextually irrelevant"
  },
  "estimatedTimeSec": 50,
  "tags": ["academic-register", "formal-writing", "precision"],
  "source": {
    "originLessonId": "vocab-hard",
    "reviewedBy": "pedagogy-team",
    "reviewStatus": "approved"
  }
}
```

## 3) Practice Set Template

Use one JSON object per practice set.

```json
{
  "courseSlug": "amirant-preparation",
  "practiceSetId": "ps-vocab-mid-01",
  "moduleSlug": "vocabulary",
  "topic": "vocabulary",
  "subtopics": ["vocab-academic-register", "vocab-collocations"],
  "difficultyRange": { "min": 2, "max": 4 },
  "numberOfQuestions": 12,
  "timeLimitSec": 720,
  "selectionRule": "random_without_repeat_within_session",
  "notes": "מיועד לתרגול בינוני לפני מבחן אדפטיבי"
}
```

## 4) Simulation Section Template

Use one JSON object per section (pilot/scored) in a full simulation.

```json
{
  "courseSlug": "amirant-preparation",
  "simulationId": "sim-01",
  "sectionId": "sim-01-scored-01",
  "sectionType": "sentence_completion",
  "scoringMode": "scored",
  "questionCount": 4,
  "timeLimitSec": 480,
  "adaptiveRules": {
    "adaptiveWithinSection": false,
    "adaptiveBetweenSections": true,
    "enterLevelSource": "previous_section_performance",
    "levelUpRule": ">=75_percent_correct_then_plus_1",
    "levelDownRule": "<=25_percent_correct_then_minus_1",
    "bounds": { "min": 1, "max": 6 }
  }
}
```

---

## Syllabus Mapping To Import Format

The list below maps each syllabus bullet ID (`src/lib/prep/amirant-course-syllabus.ts`) to the import format.

- `artifactType`:
  - `lesson` -> fill Lesson template
  - `question_bank_batch` -> fill Question template (batch)
  - `practice_set` -> fill Practice Set template
  - `simulation_section` -> fill Simulation Section template

```json
{
  "courseSlug": "amirant-preparation",
  "mappingVersion": "v1",
  "parts": [
    {
      "partId": "intro",
      "partTitle": "מבוא",
      "items": [
        { "syllabusBulletId": "intro-exam-look", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-scores-tracks", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-how-prep", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-maalau-register", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-institution-register", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-retake-rules", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-exam-day-rules", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-using-course", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-timeline-prep", "artifactType": "lesson", "moduleSlug": "introduction" },
        { "syllabusBulletId": "intro-time-pressure", "artifactType": "practice_set", "moduleSlug": "introduction" }
      ]
    },
    {
      "partId": "vocab",
      "partTitle": "מילון מושגים ואוצר מילים",
      "items": [
        { "syllabusBulletId": "vocab-glossary", "artifactType": "lesson", "moduleSlug": "vocabulary" },
        { "syllabusBulletId": "vocab-easy", "artifactType": "question_bank_batch", "moduleSlug": "vocabulary" },
        { "syllabusBulletId": "vocab-mid", "artifactType": "question_bank_batch", "moduleSlug": "vocabulary" },
        { "syllabusBulletId": "vocab-hard", "artifactType": "question_bank_batch", "moduleSlug": "vocabulary" },
        { "syllabusBulletId": "vocab-flashcards", "artifactType": "lesson", "moduleSlug": "vocabulary" },
        { "syllabusBulletId": "vocab-self-tests", "artifactType": "practice_set", "moduleSlug": "vocabulary" }
      ]
    },
    {
      "partId": "sentence-completion",
      "partTitle": "השלמת מילים במשפט",
      "items": [
        { "syllabusBulletId": "sc-guide", "artifactType": "lesson", "moduleSlug": "sentence-completion" },
        { "syllabusBulletId": "sc-video", "artifactType": "lesson", "moduleSlug": "sentence-completion" },
        { "syllabusBulletId": "sc-pack-easy", "artifactType": "question_bank_batch", "moduleSlug": "sentence-completion" },
        { "syllabusBulletId": "sc-pack-mid", "artifactType": "question_bank_batch", "moduleSlug": "sentence-completion" },
        { "syllabusBulletId": "sc-pack-hard", "artifactType": "question_bank_batch", "moduleSlug": "sentence-completion" },
        { "syllabusBulletId": "sc-pack-adaptive", "artifactType": "practice_set", "moduleSlug": "sentence-completion" }
      ]
    },
    {
      "partId": "restatement",
      "partTitle": "ניסוח משפטים מחדש",
      "items": [
        { "syllabusBulletId": "rs-guide", "artifactType": "lesson", "moduleSlug": "sentence-rephrasing" },
        { "syllabusBulletId": "rs-video", "artifactType": "lesson", "moduleSlug": "sentence-rephrasing" },
        { "syllabusBulletId": "rs-pack-easy", "artifactType": "question_bank_batch", "moduleSlug": "sentence-rephrasing" },
        { "syllabusBulletId": "rs-pack-mid", "artifactType": "question_bank_batch", "moduleSlug": "sentence-rephrasing" },
        { "syllabusBulletId": "rs-pack-hard", "artifactType": "question_bank_batch", "moduleSlug": "sentence-rephrasing" },
        { "syllabusBulletId": "rs-pack-adaptive", "artifactType": "practice_set", "moduleSlug": "sentence-rephrasing" }
      ]
    },
    {
      "partId": "reading",
      "partTitle": "קטעי קריאה",
      "items": [
        { "syllabusBulletId": "rc-guide", "artifactType": "lesson", "moduleSlug": "reading-comprehension" },
        { "syllabusBulletId": "rc-video", "artifactType": "lesson", "moduleSlug": "reading-comprehension" },
        { "syllabusBulletId": "rc-pack-easy", "artifactType": "question_bank_batch", "moduleSlug": "reading-comprehension" },
        { "syllabusBulletId": "rc-pack-mid", "artifactType": "question_bank_batch", "moduleSlug": "reading-comprehension" },
        { "syllabusBulletId": "rc-pack-hard", "artifactType": "question_bank_batch", "moduleSlug": "reading-comprehension" },
        { "syllabusBulletId": "rc-pack-adaptive", "artifactType": "practice_set", "moduleSlug": "reading-comprehension" }
      ]
    },
    {
      "partId": "pilot-2026",
      "partTitle": "פיילוט ורפורמות",
      "items": [
        { "syllabusBulletId": "pilot-listening", "artifactType": "lesson", "moduleSlug": "new-exam-format-2026" },
        { "syllabusBulletId": "pilot-listen-gap", "artifactType": "question_bank_batch", "moduleSlug": "new-exam-format-2026" },
        { "syllabusBulletId": "pilot-word-formation", "artifactType": "question_bank_batch", "moduleSlug": "new-exam-format-2026" },
        { "syllabusBulletId": "pilot-grammar-context", "artifactType": "question_bank_batch", "moduleSlug": "new-exam-format-2026" },
        { "syllabusBulletId": "pilot-writing", "artifactType": "lesson", "moduleSlug": "new-exam-format-2026" },
        { "syllabusBulletId": "pilot-scoring-note", "artifactType": "lesson", "moduleSlug": "new-exam-format-2026" }
      ]
    },
    {
      "partId": "full-sims",
      "partTitle": "סימולציות מלאות וסיום",
      "items": [
        { "syllabusBulletId": "sim-howto", "artifactType": "lesson", "moduleSlug": "full-simulations" },
        { "syllabusBulletId": "sim-five-six", "artifactType": "simulation_section", "moduleSlug": "full-simulations" },
        { "syllabusBulletId": "sim-ai", "artifactType": "lesson", "moduleSlug": "full-simulations" },
        { "syllabusBulletId": "sim-calc", "artifactType": "lesson", "moduleSlug": "full-simulations" },
        { "syllabusBulletId": "sim-tips", "artifactType": "lesson", "moduleSlug": "tips-strategies" },
        { "syllabusBulletId": "sim-before", "artifactType": "lesson", "moduleSlug": "tips-strategies" },
        { "syllabusBulletId": "sim-during", "artifactType": "lesson", "moduleSlug": "tips-strategies" },
        { "syllabusBulletId": "sim-techniques", "artifactType": "lesson", "moduleSlug": "tips-strategies" },
        { "syllabusBulletId": "sim-after", "artifactType": "lesson", "moduleSlug": "course-summary" },
        { "syllabusBulletId": "sim-summary-course", "artifactType": "lesson", "moduleSlug": "course-summary" },
        { "syllabusBulletId": "sim-quiz-final", "artifactType": "practice_set", "moduleSlug": "course-summary" },
        { "syllabusBulletId": "sim-feedback", "artifactType": "lesson", "moduleSlug": "course-summary" },
        { "syllabusBulletId": "sim-upsell", "artifactType": "lesson", "moduleSlug": "course-summary" }
      ]
    }
  ]
}
```

## Writer Workflow

1. Fill lesson JSONs from syllabus mapping rows tagged `lesson`.
2. Fill question JSONs in batches from rows tagged `question_bank_batch`.
3. Define practice sets from rows tagged `practice_set`.
4. Define simulation sections from rows tagged `simulation_section`.
5. For each lesson, ensure `aiRetrievalText` is complete and normalized for retrieval.
