import { supabase } from '@/lib/supabase'

export interface SearchHit {
  id: string
  title: string
  slug: string
  summary: string
  updated_at: string
  view_count: number
  category: { id: string; name: string; slug: string }
  /** Raw ts_rank_cd score. Only meaningful relative to the other hits of the same search. */
  rank: number
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
}

export interface SearchOutcome {
  hits: SearchHit[]
  /** id of the search_logs row for this search (null if logging failed) – used to record the click. */
  logId: string | null
}

export async function searchArticles(query: string): Promise<SearchOutcome> {
  const { data, error } = await supabase.rpc('search_articles', { p_query: query, p_limit: 30 })
  if (error) throw error

  const hits = (data as SearchRow[]).map<SearchHit>((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    updated_at: row.updated_at,
    view_count: row.view_count,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    rank: row.rank,
  }))

  // Logging must never break searching: if it fails the user still gets results.
  const logId = await logSearch(query, hits.length).catch(() => null)
  return { hits, logId }
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
