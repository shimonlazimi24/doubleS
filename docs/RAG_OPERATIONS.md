# Amirant RAG Operations

## 1) Apply migration

Run SQL migration that includes:

- `create extension if not exists vector`
- `course_content_chunks.embedding vector(1536)`
- `match_course_content_chunks(...)` RPC
- vector index (`ivfflat`)

File: `supabase/amirant-production-mvp-schema.sql`

## 2) Sync embeddings

```bash
npm run embeddings:amirant-sync
```

This ingests embeddings for:

- lesson text
- question explanations

into `course_content_chunks`.

## 3) Health check

```bash
npm run rag:amirant-health
```

Checks:

- chunk count > 0
- embedding count > 0
- vector RPC callable with sample query

## 4) Runtime behavior

- Query-based retrieval uses vector similarity first.
- If vector retrieval yields no rows (e.g., missing embeddings), retrieval falls back to filtered chunk fetch.

## 5) Required env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- optional: `OPENAI_EMBEDDING_MODEL`
