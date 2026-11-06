import { supabase } from '@/lib/supabase'

interface BatchResult {
  done: boolean
  next: number
  total: number
}

async function callBatch(
  articleId: string,
  fromChunk: number,
  limit?: number,
): Promise<BatchResult> {
  const { data, error } = await supabase.functions.invoke<BatchResult>('embed-article', {
    body: { article_id: articleId, from_chunk: fromChunk, ...(limit ? { limit } : {}) },
  })
  if (error || !data) throw error ?? new Error('Empty response')
  return data
}

/**
 * Rebuilds the AI-search index of one article. The Edge Function has a small CPU budget per
 * request, so it embeds a few chunks at a time and tells us where to continue – we simply keep
 * calling until it reports `done`. Call this after every save (drafts get removed from the index).
 *
 * If a batch fails (e.g. CPU limit hit on a cold start), we retry once with a single chunk.
 */
export async function indexArticle(articleId: string): Promise<{ chunks: number }> {
  let from = 0
  for (let step = 0; step < 60; step++) {
    let result: BatchResult
    try {
      result = await callBatch(articleId, from)
    } catch {
      result = await callBatch(articleId, from, 1)
    }
    if (result.done) return { chunks: result.total }
    from = result.next
  }
  throw new Error('Indexing did not finish')
}

/** Rebuilds the index for ALL articles, one after another. `onProgress(done, total)` drives the UI. */
export async function rebuildSearchIndex(
  onProgress?: (done: number, total: number) => void,
): Promise<{ indexed: number; chunks: number }> {
  const { data, error } = await supabase.from('articles').select('id')
  if (error) throw error

  let chunks = 0
  onProgress?.(0, data.length)
  for (const [index, { id }] of data.entries()) {
    chunks += (await indexArticle(id)).chunks
    onProgress?.(index + 1, data.length)
  }
  return { indexed: data.length, chunks }
}
