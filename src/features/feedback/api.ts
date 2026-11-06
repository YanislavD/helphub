import { supabase } from '@/lib/supabase'

export interface MyFeedback {
  helpful: boolean
  comment: string
}

export interface FeedbackStats {
  helpful: number
  total: number
}

/** The signed-in user's own vote for an article (null = hasn't voted). RLS guarantees "own". */
export async function fetchMyFeedback(articleId: string): Promise<MyFeedback | null> {
  const { data, error } = await supabase
    .from('article_feedback')
    .select('helpful, comment')
    .eq('article_id', articleId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Insert-or-update: one vote per user and article (unique constraint), changeable later. */
export async function saveFeedback(
  articleId: string,
  helpful: boolean,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from('article_feedback')
    .upsert(
      { article_id: articleId, helpful, comment: comment.slice(0, 1000) },
      { onConflict: 'article_id,user_id' },
    )
  if (error) throw error
}

export async function deleteMyFeedback(articleId: string): Promise<void> {
  // user_id is not needed in the filter: RLS only lets us delete our own row anyway.
  const { error } = await supabase.from('article_feedback').delete().eq('article_id', articleId)
  if (error) throw error
}

export async function fetchFeedbackStats(articleId: string): Promise<FeedbackStats> {
  const { data, error } = await supabase.rpc('article_feedback_stats', { p_article_id: articleId })
  if (error) throw error
  const row = (data as Array<{ helpful_count: number; total_count: number }>)[0]
  return { helpful: Number(row?.helpful_count ?? 0), total: Number(row?.total_count ?? 0) }
}

/** Staff only: article id → stats for all articles (agent list, dashboard). */
export async function fetchFeedbackSummary(): Promise<Record<string, FeedbackStats>> {
  const { data, error } = await supabase.rpc('article_feedback_summary')
  if (error) throw error
  return Object.fromEntries(
    (data as Array<{ article_id: string; helpful_count: number; total_count: number }>).map((r) => [
      r.article_id,
      { helpful: Number(r.helpful_count), total: Number(r.total_count) },
    ]),
  )
}
