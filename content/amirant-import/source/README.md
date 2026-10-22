# Amirant Production Source Files

Authoring inputs for the ingestion layer and the coverage tooling:

- `lessons.json`
- `questions.json`
- `passages.json`
- `practice-sets.json`
- `simulations.json`
- `ai-retrieval.json`
- `syllabus-mapping.json`

Only `questions.json` and `passages.json` are read by the running app
(`src/lib/amirant-course/content-source/question-source.ts`, server side).
The others feed `scripts/generate-course-manifest.mjs`, the ingest and
coverage scripts and the embeddings sync, and are not loaded per request.
