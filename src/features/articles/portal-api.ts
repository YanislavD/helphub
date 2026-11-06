import { supabase } from '@/lib/supabase'
import type { Article, ArticleListItem } from './types'

/*
 * Read-side API for the employee portal.
 *
 * Important: agents/admins can read drafts through RLS, so every query here ALSO filters on
 * status = 'published'. That way the portal looks the same for every role.
 */

export interface PortalArticle extends ArticleListItem {
  published_at: string | null
}

export type PortalArticleDetail = Article & {
  category: { id: string; name: string; slug: string } | null
}

const LIST_FIELDS =
  'id, title, slug, summary, status, view_count, created_at, updated_at, published_at'

export interface PublishedListOptions {
  categorySlug?: string
  order: 'new' | 'popular'
  limit?: number
}

export async function fetchPublishedArticles({
  categorySlug,
  order,
  limit = 20,
}: PublishedListOptions): Promise<PortalArticle[]> {
  // `!inner` turns the embedded category into an INNER JOIN, which lets us filter by its slug.
  const category = categorySlug
    ? 'category:categories!inner(id, name, slug)'
    : 'category:categories(id, name, slug)'

  let query = supabase
    .from('articles')
    .select(`${LIST_FIELDS}, ${category}`)
    .eq('status', 'published')
  if (categorySlug) query = query.eq('category.slug', categorySlug)

  query =
    order === 'new'
      ? query.order('published_at', { ascending: false, nullsFirst: false })
      : query.order('view_count', { ascending: false })

  const { data, error } = await query.limit(limit)
  if (error) throw error
  return data as unknown as PortalArticle[]
}

/** Returns null when the slug doesn't exist OR the article is a draft (RLS + status filter). */
export async function fetchPublishedArticleBySlug(
  slug: string,
): Promise<PortalArticleDetail | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data as unknown as PortalArticleDetail | null
}

export async function fetchRelatedArticles(
  categoryId: string,
  excludeId: string,
  limit = 3,
): Promise<PortalArticle[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`${LIST_FIELDS}, category:categories(id, name, slug)`)
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .order('view_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as PortalArticle[]
}

/** category id → number of published articles */
export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('published_article_counts')
  if (error) throw error
  return Object.fromEntries(
    (data as Array<{ category_id: string; article_count: number }>).map((row) => [
      row.category_id,
      Number(row.article_count),
    ]),
  )
}

export async function fetchAuthorName(authorId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('author_names', { p_ids: [authorId] })
  if (error) throw error
  return (data as Array<{ full_name: string }>)[0]?.full_name || null
}

export async function incrementArticleViews(articleId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_article_views', { p_article_id: articleId })
  if (error) throw error
}
