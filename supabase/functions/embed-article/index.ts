// Edge Function: (re)builds the search index of an article.
//
// Called by the app right after an agent saves an article:   { "article_id": "<uuid>" }
// Admins can rebuild the whole index:                         { "all": true }
//
// Steps: load article → split into chunks → embed every chunk → replace the old chunks.
// Only PUBLISHED articles are indexed; drafts (and unpublished articles) get their chunks removed,
// so they can never show up in search results.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { authenticate, HttpError } from '../_shared/auth.ts'
import { chunkArticle } from '../_shared/chunk.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { embed, toVectorLiteral } from '../_shared/embed.ts'

async function indexArticle(admin: SupabaseClient, articleId: string): Promise<number> {
  const { data: article, error } = await admin
    .from('articles')
    .select('id, title, summary, content, tags, status')
    .eq('id', articleId)
    .maybeSingle()
  if (error) throw error

  // Not published (or deleted): make sure nothing of it stays searchable.
  if (!article || article.status !== 'published') {
    await admin.from('article_chunks').delete().eq('article_id', articleId)
    return 0
  }

  // Embed first, replace afterwards – if the model fails, the old index stays intact.
  const texts = chunkArticle(article)
  const rows = []
  for (const [index, content] of texts.entries()) {
    rows.push({
      article_id: articleId,
      chunk_index: index,
      content,
      embedding: toVectorLiteral(await embed(content)),
    })
  }

  const { error: deleteError } = await admin.from('article_chunks').delete().eq('article_id', articleId)
  if (deleteError) throw deleteError
  const { error: insertError } = await admin.from('article_chunks').insert(rows)
  if (insertError) throw insertError

  return rows.length
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { role, adminClient } = await authenticate(req)
    if (role !== 'agent' && role !== 'admin') throw new HttpError(403, 'Only agents and admins can index articles')

    const body = (await req.json().catch(() => ({}))) as { article_id?: string; all?: boolean }

    if (body.all) {
      if (role !== 'admin') throw new HttpError(403, 'Only admins can rebuild the whole index')
      const { data, error } = await adminClient.from('articles').select('id')
      if (error) throw error

      let chunks = 0
      for (const { id } of data) chunks += await indexArticle(adminClient, id)
      return json({ indexed: data.length, chunks })
    }

    if (!body.article_id || !/^[0-9a-f-]{36}$/i.test(body.article_id)) {
      throw new HttpError(400, 'article_id (uuid) is required')
    }
    const chunks = await indexArticle(adminClient, body.article_id)
    return json({ indexed: 1, chunks })
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error('embed-article failed', error)
    return json({ error: 'Indexing failed' }, 500)
  }
})
