// Edge Function: hybrid search (keywords + meaning).
//
//   POST { "query": "ich komme nicht in meinen PC rein" }
//   → { "semantic": true, "hits": [ … ] }
//
// 1. embed the question with Gemini (same model that embedded the articles, see _shared/embed.ts)
// 2. call the SQL function hybrid_search_articles, which fuses keyword and vector results
//
// The database call runs AS THE CALLER (userClient), so Row Level Security still applies – this
// function never needs elevated rights. If the model fails we degrade gracefully to keyword search.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { authenticate, HttpError } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { embedQuery, toVectorLiteral } from '../_shared/embed.ts'

// Gemini embeddings spread German texts much wider than gte-small did (0.80–0.94), so the database
// defaults (floor 0.80, margin 0.06) would throw away every hit. These values are deliberately
// permissive; the UI decides what counts as "strong" (STRONG_SIMILARITY in relevance.ts).
const MIN_SIMILARITY = 0.5
const RELATIVE_MARGIN = 0.15

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userClient } = await authenticate(req)

    const body = (await req.json().catch(() => ({}))) as { query?: unknown }
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (query.length < 2 || query.length > 300) {
      throw new HttpError(400, 'query must be between 2 and 300 characters')
    }

    let embedding: number[] | null = null
    try {
      embedding = await embedQuery(query, Deno.env.get('GEMINI_API_KEY'))
    } catch (error) {
      console.error('embedding failed, falling back to keyword search', error)
    }

    const { data, error } = embedding
      ? await userClient.rpc('hybrid_search_articles', {
          p_query: query,
          p_embedding: toVectorLiteral(embedding),
          p_limit: 30,
          p_min_similarity: MIN_SIMILARITY,
          p_relative_margin: RELATIVE_MARGIN,
        })
      : await userClient.rpc('search_articles', { p_query: query, p_limit: 30 })
    if (error) throw error

    return json({ semantic: embedding !== null, hits: data })
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error('search failed', error)
    return json({ error: 'Search failed' }, 500)
  }
})
