# Amirant AI — manual QA checklist

Use this to verify the production AI stack: env, DB, RAG, endpoints, fallbacks, and logs.

1. **Environment** — Set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL=gpt-4o-mini`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (server-only) `SUPABASE_SERVICE_ROLE_KEY`. Optional: `GEMINI_API_KEY`, `GEMINI_CHAT_MODEL=gemini-1.5-pro` for fallback. Never commit real keys; copy from `.env.example` only as placeholders.

2. **Migrations** — Apply `supabase/amirant-production-mvp-schema.sql` (and any follow-up SQL your project uses) so `course_content_chunks` and `match_course_content_chunks` exist with `pgvector`.

3. **Embeddings sync** — Run `npm run embeddings:amirant-sync` (requires `OPENAI_API_KEY` and service role) to populate `course_content_chunks.embedding`.

4. **RAG health** — Run `npm run rag:amirant-health`; expect `status: "healthy"` when chunks and embeddings exist and the vector RPC works.

5. **AI health** — Start the app (`npm run dev`), set `AI_HEALTH_URL=http://localhost:3000` (optional; otherwise the script prints env + DB only), then run `npm run ai:health`. Confirm `config.hasOpenAiKey`, chunk/embedding counts, and `vectorSearch.works` when the service role is set on the server.

6. **Lesson chat** — Sign in, open a lesson with chat, and ask a question that appears in course text. Expect a grounded answer with `references` to chunk ids and `safeFallback: false` when context exists.

7. **Out-of-course question** — Ask something not covered by chunks. Expect a safe reply with `safeFallback: true` and no fabricated course facts.

8. **Fallback** — With API keys removed or on network failure, expect Hebrew safe fallback text and `safeFallback: true` (and no crash).

9. **AI insight log** — After a call, check `amirant_ai_insights` for a row with the right `insight_kind`, `model`, and `input_refs` (chunk metadata). Server logs also emit `ai_request` / `ai_response` lines.

10. **Usage / cost log** — In server logs, look for JSON lines with `event: "ai_usage"`, `endpoint`, `provider`, `model`, `inputTokens`, `outputTokens`, `estimatedCostUsd`, and `userId` (and optional `sessionId` if the client sends header `x-prep-session-id`). Cache hits show `cacheHit: true` with zero tokens and near-zero cost.

**Headers (optional):** `x-prep-session-id` — correlation id for usage logging. Rate limits use both authenticated `userId` and client IP (`x-forwarded-for` / `x-real-ip`).
