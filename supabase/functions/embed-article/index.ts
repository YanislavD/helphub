// Edge Function: (re)builds the search index of ONE article, in small batches.
//
//   { "article_id": "<uuid>", "from_chunk": 0, "limit": 8 }
//   → { "done": false, "next": 3, "total": 7 }      (call again with from_chunk = next)
//   → { "done": true,  "next": 7, "total": 7 }
//
// Why batches? Edge Functions have a hard CPU-time budget per request (about 2 s on the free plan;
// exceeding it kills the request with HTTP 546 "CPU Time exceeded"). Running the embedding model
// for a whole article – let alone all articles – can exceed that. So each request embeds only as
// many chunks as fit into a small time budget and tells the caller where to continue.
//
// Only PUBLISHED articles are indexed; for drafts (and unpublished articles) the chunks are removed,
// so they can never show up in search results.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { authenticate, HttpError } from '../_shared/auth.ts'
import { chunkArticle } from '../_shared/chunk.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { embed, toVectorLiteral } from '../_shared/embed.ts'

/** Stop starting new chunks after this much wall-clock time (a safe proxy for CPU time). */
const TIME_BUDGET_MS = 800
const MAX_CHUNKS_PER_REQUEST = 8

interface BatchResult {
  done: boolean
  next: number
  total: number
}

async function indexBatch(
  admin: SupabaseClient,
  articleId: string,
  fromChunk: number,
  limit: number,
  startedAt: number,
): Promise<BatchResult> {
  const { data: article, error } = await admin
    .from('articles')
    .select('id, title, summary, content, tags, status')
    .eq('id', articleId)
    .maybeSingle()
  if (error) throw error

  // Not published (or deleted): make sure nothing of it stays searchable.
  if (!article || article.status !== 'published') {
    await admin.from('article_chunks').delete().eq('article_id', articleId)
    return { done: true, next: 0, total: 0 }
  }

  // Chunking is pure and deterministic, so every batch recomputes the same list cheaply.
  const texts = chunkArticle(article)

  const rows = []
  for (let i = fromChunk; i < texts.length && rows.length < limit; i++) {
    // Always embed at least one chunk (progress!), then respect the time budget.
    if (rows.length > 0 && performance.now() - startedAt > TIME_BUDGET_MS) break
    rows.push({
      article_id: articleId,
      chunk_index: i,
      content: texts[i],
      embedding: toVectorLiteral(await embed(texts[i])),
    })
  }

  // Upsert = insert, or overwrite the chunk with the same (article_id, chunk_index).
  // The article stays searchable with its old chunks while the new ones come in.
  if (rows.length > 0) {
    const { error: upsertError } = await admin
      .from('article_chunks')
      .upsert(rows, { onConflict: 'article_id,chunk_index' })
    if (upsertError) throw upsertError
  }

  const next = fromChunk + rows.length
  const done = next >= texts.length

  // Last batch: remove leftovers of an older, longer version of the article.
  if (done) {
    const { error: cleanupError } = await admin
      .from('article_chunks')
      .delete()
      .eq('article_id', articleId)
      .gte('chunk_index', texts.length)
    if (cleanupError) throw cleanupError
  }

  return { done, next, total: texts.length }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const startedAt = performance.now()

  try {
    const { role, adminClient } = await authenticate(req)
    if (role !== 'agent' && role !== 'admin') {
      throw new HttpError(403, 'Only agents and admins can index articles')
    }

    const body = (await req.json().catch(() => ({}))) as {
      article_id?: string
      from_chunk?: number
      limit?: number
    }

    if (!body.article_id || !/^[0-9a-f-]{36}$/i.test(body.article_id)) {
      throw new HttpError(400, 'article_id (uuid) is required')
    }
    const fromChunk = Number.isInteger(body.from_chunk) ? Math.max(0, body.from_chunk!) : 0
    const limit = Number.isInteger(body.limit)
      ? Math.min(MAX_CHUNKS_PER_REQUEST, Math.max(1, body.limit!))
      : MAX_CHUNKS_PER_REQUEST

    return json(await indexBatch(adminClient, body.article_id, fromChunk, limit, startedAt))
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error('embed-article failed', error)
    return json({ error: 'Indexing failed' }, 500)
  }
})
