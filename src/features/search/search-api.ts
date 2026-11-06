import { supabase } from '@/lib/supabase'

export interface SearchHit {
  id: string
  title: string
  slug: string
  summary: string
  updated_at: string
  view_count: number
  category: { id: string; name: string; slug: string }
  /** Ranking score (RRF for hybrid search, ts_rank for keyword search). Only comparable within one search. */
  rank: number
  /** Cosine similarity of the best matching chunk (hybrid search only). Handy for tuning. */
  similarity: number | null
}

interface SearchRow {
  id: string
  title: string
  slug: string
  summary: string
  view_count: number
  updated_at: string
  category_id: string
  category_name: string
  category_slug: string
  rank: number
  similarity?: number | null
}

export interface SearchOutcome {
  hits: SearchHit[]
  /** true = the AI (semantic) search took part; false = keyword search only (fallback). */
  semantic: boolean
  /** id of the search_logs row for this search (null if logging failed) – used to record the click. */
  logId: string | null
}

function toHit(row: SearchRow): SearchHit {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    updated_at: row.updated_at,
    view_count: row.view_count,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    rank: row.rank,
    similarity: row.similarity ?? null,
  }
}

/** Keyword-only search straight from the database (stage 5). Used as a safety net. */
async function searchKeywordsOnly(query: string): Promise<SearchRow[]> {
  const { data, error } = await supabase.rpc('search_articles', { p_query: query, p_limit: 30 })
  if (error) throw error
  return data as SearchRow[]
}

/**
 * Hybrid search through the `search` Edge Function. If the function is unreachable, errors or the
 * model is cold/broken, we fall back to plain keyword search – the user always gets an answer.
 */
async function searchViaEdgeFunction(
  query: string,
): Promise<{ rows: SearchRow[]; semantic: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      semantic: boolean
      hits: SearchRow[]
    }>('search', { body: { query } })
    if (error || !data) throw error ?? new Error('Empty response')
    return { rows: data.hits, semantic: data.semantic }
  } catch (error) {
    console.warn('AI search unavailable, using keyword search', error)
    return { rows: await searchKeywordsOnly(query), semantic: false }
  }
}

export async function searchArticles(query: string): Promise<SearchOutcome> {
  const { rows, semantic } = await searchViaEdgeFunction(query)
  const hits = rows.map(toHit)

  if (import.meta.env.DEV) {
    // Development aid for tuning the similarity thresholds (see hybrid_search_articles).
    console.table(
      hits.map((h) => ({ title: h.title, score: h.rank, similarity: h.similarity, semantic })),
    )
  }

  // Logging must never break searching: if it fails the user still gets results.
  const logId = await logSearch(query, hits.length).catch(() => null)
  return { hits, semantic, logId }
}

async function logSearch(query: string, resultsCount: number): Promise<string> {
  const { data, error } = await supabase
    .from('search_logs')
    .insert({ query: query.slice(0, 300), results_count: resultsCount })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** Remember which result the user opened (fire-and-forget). */
export function recordSearchClick(logId: string, articleId: string): void {
  void supabase
    .from('search_logs')
    .update({ clicked_article_id: articleId })
    .eq('id', logId)
    .then(() => undefined)
}
