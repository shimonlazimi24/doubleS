import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const envParsed = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_EMBEDDING_MODEL: z.string().min(1).optional(),
  })
  .safeParse(process.env);
if (!envParsed.success) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
  ];
  const empty = required.filter((k) => {
    const v = process.env[k];
    return typeof v !== "string" || v.trim() === "";
  });
  console.error("embeddings:amirant-sync — env validation failed.");
  console.error("Loads `.env` and `.env.local` from the project root (uncomment and set key=value lines).");
  if (empty.length > 0) {
    console.error("Unset or empty:", empty.join(", "));
  } else {
    console.error("Some values are invalid (e.g. URL). Details:");
    console.error(envParsed.error.flatten());
  }
  process.exit(1);
}
const ENV = envParsed.data;

const ROOT = process.cwd();
const COURSE_SLUG = "amirant-preparation";
const EMBEDDING_MODEL = ENV.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

const LESSONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "lessons.json",
);
const QUESTIONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "questions.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Replaces lone UTF-16 surrogates (invalid in JSON / Postgres json) with U+FFFD. */
function sanitizeText(s) {
  return String(s).replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/gu,
    "\uFFFD",
  );
}

function stableUuid(seed) {
  const hex = crypto.createHash("md5").update(seed).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(
    13,
    16,
  )}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function blockToText(block) {
  if (!block || typeof block !== "object") return "";
  if (block.type === "examples" && Array.isArray(block.items)) {
    return `${block.title}\n${block.items.join("\n")}`;
  }
  if (block.type === "summary" && Array.isArray(block.bullets)) {
    return `${block.title}\n${block.bullets.join("\n")}`;
  }
  return `${block.title ?? ""}\n${block.body ?? ""}`.trim();
}

function buildChunks() {
  const lessons = readJson(LESSONS_PATH);
  const questions = readJson(QUESTIONS_PATH);
  const chunks = [];

  for (const lesson of lessons) {
    const lessonId = String(lesson.lessonId ?? "").trim();
    if (!lessonId) continue;
    const moduleSlug = String(lesson.moduleSlug ?? "").trim() || null;
    const content = Array.isArray(lesson.contentBlocks)
      ? lesson.contentBlocks.map(blockToText).filter(Boolean).join("\n\n")
      : "";
    const retrievalText = String(lesson.aiRetrievalText ?? "").trim();
    const text = [lesson.lessonTitle, retrievalText, content]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join("\n\n");
    if (!text) continue;

    chunks.push({
      sourceKey: `lesson:${lessonId}`,
      moduleSlug,
      lessonId,
      topic: null,
      chunkText: text.slice(0, 10000),
      metadata: {
        source_kind: "lesson_text",
        lessonId,
        moduleSlug,
      },
    });
  }

  for (const question of questions) {
    const questionId = String(question.questionId ?? "").trim();
    const explanation = String(question.explanation ?? "").trim();
    if (!questionId || !explanation) continue;
    const topic = String(question.topic ?? "").trim() || null;
    const prompt = String(question.questionText ?? "").trim();
    const text = [prompt, `Explanation: ${explanation}`]
      .filter(Boolean)
      .join("\n\n");

    chunks.push({
      sourceKey: `question_explanation:${questionId}`,
      moduleSlug: null,
      lessonId: null,
      topic,
      chunkText: text.slice(0, 4000),
      metadata: {
        source_kind: "question_explanation",
        questionId,
        topic,
      },
    });
  }

  return chunks;
}

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Embedding request failed: ${res.status} ${txt}`);
  }
  const payload = await res.json();
  return (payload.data ?? []).map((x) => x.embedding);
}

async function main() {
  const client = createClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const chunks = buildChunks();
  if (chunks.length === 0) {
    console.log("No chunks to sync.");
    return;
  }

  const rows = [];
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE).map((c) => ({
      ...c,
      chunkText: sanitizeText(c.chunkText),
      sourceKey: sanitizeText(c.sourceKey),
      moduleSlug: c.moduleSlug != null ? sanitizeText(c.moduleSlug) : c.moduleSlug,
      lessonId: c.lessonId != null ? sanitizeText(c.lessonId) : c.lessonId,
      topic: c.topic != null ? sanitizeText(c.topic) : c.topic,
      metadata: Object.fromEntries(
        Object.entries(c.metadata).map(([k, v]) => [
          k,
          typeof v === "string" ? sanitizeText(v) : v,
        ]),
      ),
    }));
    const embeddings = await embedBatch(batch.map((x) => x.chunkText));
    if (embeddings.length !== batch.length) {
      throw new Error("Embedding count mismatch.");
    }
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const meta = {
        ...item.metadata,
        source_key: item.sourceKey,
        embedding_model: EMBEDDING_MODEL,
      };
      rows.push({
        id: stableUuid(`${COURSE_SLUG}:${item.sourceKey}`),
        course_slug: COURSE_SLUG,
        module_slug: item.moduleSlug,
        lesson_id: item.lessonId,
        topic: item.topic,
        chunk_text: item.chunkText,
        embedding: embeddings[j],
        metadata: meta,
      });
    }
    console.log(`Embedded ${Math.min(i + BATCH_SIZE, chunks.length)} / ${chunks.length}`);
  }

  // One giant upsert can exceed request-size limits; truncated JSON => "invalid input syntax for type json".
  const UPSERT_BATCH = 30;
  for (let o = 0; o < rows.length; o += UPSERT_BATCH) {
    const slice = rows.slice(o, o + UPSERT_BATCH);
    const { error } = await client
      .from("course_content_chunks")
      .upsert(slice, { onConflict: "id" });
    if (error) {
      const detail = [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(" | ");
      throw new Error(
        `Supabase upsert failed (rows ${o}–${o + slice.length - 1}): ${detail}`,
      );
    }
  }
  console.log(`Synced ${rows.length} course_content_chunks rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
