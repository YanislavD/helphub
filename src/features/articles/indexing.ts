import { supabase } from '@/lib/supabase'

interface IndexResult {
  indexed: number
  chunks: number
}

/**
 * Asks the `embed-article` Edge Function to rebuild the AI-search index of one article.
 * Call this after every save: it indexes published articles and removes drafts from the index.
 */
export async function indexArticle(articleId: string): Promise<IndexResult> {
  const { data, error } = await supabase.functions.invoke<IndexResult>('embed-article', {
    body: { article_id: articleId },
  })
  if (error || !data) throw error ?? new Error('Empty response')
  return data
}

/** Admin only: rebuilds the index for every article (e.g. after seeding or changing the chunking). */
export async function rebuildSearchIndex(): Promise<IndexResult> {
  const { data, error } = await supabase.functions.invoke<IndexResult>('embed-article', {
    body: { all: true },
  })
  if (error || !data) throw error ?? new Error('Empty response')
  return data
}
