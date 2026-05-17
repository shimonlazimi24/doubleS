# Amirant Content Remediation Plan

Generated at: 2026-04-25T10:44:27.652Z

## Current blockers

- critical_issue: 209
- needs_review: 191
- pass: 0

## Critical grouping

### By issue type
- repeated_template_similarity: 322
- shallow_explanation: 160
- language_quality: 153
- difficulty_mismatch: 2
- too_easy_to_eliminate: 1

### By topic
- vocabulary: 111
- reading_comprehension: 44
- sentence_completion: 44
- rephrasing: 10

### By difficulty
- 1: 60
- 2: 20
- 3: 8
- 4: 50
- 5: 11
- 6: 60

### Repeated-template clusters (top)
- vocabulary-generated-bulk: 110
- sentence_completion-generated-bulk: 44
- reading_comprehension-generated-bulk: 39
- rephrasing-generated-bulk: 10
- vocabulary-unit-1-3-entry-diagnostic-test: 1
- reading_comprehension-reading-comp-quiz-2-easy: 1
- reading_comprehension-reading-comp-quiz-3-intermediate: 1
- reading_comprehension-reading-comp-quiz-4-intermediate: 1

## Batch plan

- Batch 1 (top 50): 50 questions
- Batch 2 (next 50): 50 questions
- Batch 3 (remaining): 109 questions

Batch remediation order:
1. Remove generated/template markers from IDs/text/tags where they trigger critical flags.
2. Rewrite stems with topic-correct format and stronger distractors.
3. Upgrade explanation quality to pedagogical reasoning.
4. Re-run QA gate after each batch.

