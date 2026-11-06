// Edge Function: hybrid search (keywords + meaning).
//
//   POST { "query": "ich komme nicht in meinen PC rein" }
//   → { "semantic": true, "hits": [ … ] }
//
// 1. embed the question with gte-small (same model that embedded the articles)
// 2. call the SQL function hybrid_search_articles, which fuses keyword and vector results
//
// The database call runs AS THE CALLER (userClient), so Row Level Security still applies – this
// function never needs elevated rights. If the model fails we degrade gracefully to keyword search.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { authenticate, HttpError } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { embed, toVectorLiteral } from '../_shared/embed.ts'

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
      embedding = await embed(query)
    } catch (error) {
      console.error('embedding failed, falling back to keyword search', error)
    }

    const { data, error } = embedding
      ? await userClient.rpc('hybrid_search_articles', {
          p_query: query,
          p_embedding: toVectorLiteral(embedding),
          p_limit: 30,
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
