import { supabase } from '@/lib/supabase'

/*
 * The numbers come from SQL functions (supabase/migrations/…_dashboard.sql) that only agents and
 * admins may call. Postgres returns them in snake_case; here they become a friendlier shape.
 */

export interface Overview {
  searches: number
  searchesPrev: number
  clicked: number
  clickedPrev: number
  openTickets: number
  newTickets: number
  publishedArticles: number
  draftArticles: number
}

export interface DayPoint {
  day: string // ISO date, e.g. 2026-11-06
  searches: number
  withoutResults: number
}

export interface TermStat {
  term: string
  searches: number
  clicks: number
  lastAt: string | null
}

export interface ArticleRating {
  articleId: string
  title: string
  slug: string
  helpful: number
  total: number
  rate: number
}

export interface CategoryViews {
  id: string
  name: string
  slug: string
  views: number
  articles: number
}

const n = (value: unknown) => Number(value ?? 0)

export async function fetchOverview(days: number): Promise<Overview> {
  const { data, error } = await supabase.rpc('dashboard_overview', { p_days: days })
  if (error) throw error
  const r = (data as Array<Record<string, unknown>>)[0] ?? {}
  return {
    searches: n(r.searches),
    searchesPrev: n(r.searches_prev),
    clicked: n(r.clicked),
    clickedPrev: n(r.clicked_prev),
    openTickets: n(r.open_tickets),
    newTickets: n(r.new_tickets),
    publishedArticles: n(r.published_articles),
    draftArticles: n(r.draft_articles),
  }
}

export async function fetchTimeseries(days: number): Promise<DayPoint[]> {
  const { data, error } = await supabase.rpc('dashboard_search_timeseries', { p_days: days })
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((r) => ({
    day: String(r.day),
    searches: n(r.searches),
    withoutResults: n(r.without_results),
  }))
}

export async function fetchTopQueries(days: number): Promise<TermStat[]> {
  const { data, error } = await supabase.rpc('dashboard_top_queries', { p_days: days, p_limit: 8 })
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((r) => ({
    term: String(r.term),
    searches: n(r.searches),
    clicks: n(r.clicks),
    lastAt: null,
  }))
}

export async function fetchUnansweredQueries(days: number): Promise<TermStat[]> {
  const { data, error } = await supabase.rpc('dashboard_unanswered_queries', {
    p_days: days,
    p_limit: 8,
  })
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((r) => ({
    term: String(r.term),
    searches: n(r.searches),
    clicks: 0,
    lastAt: r.last_at ? String(r.last_at) : null,
  }))
}

/** All rated articles, best first. */
export async function fetchRatings(): Promise<ArticleRating[]> {
  const { data, error } = await supabase.rpc('dashboard_article_ratings', { p_min_votes: 1 })
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((r) => ({
    articleId: String(r.article_id),
    title: String(r.title),
    slug: String(r.slug),
    helpful: n(r.helpful_count),
    total: n(r.total_count),
    rate: n(r.rate),
  }))
}

export async function fetchViewsByCategory(): Promise<CategoryViews[]> {
  const { data, error } = await supabase.rpc('dashboard_views_by_category')
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.category_id),
    name: String(r.name),
    slug: String(r.slug),
    views: n(r.views),
    articles: n(r.articles),
  }))
}
