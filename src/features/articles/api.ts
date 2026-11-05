import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'
import type { Article, ArticleInput, ArticleListItem, ArticleStatus, Category } from './types'

export const PAGE_SIZE = 8

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, sort_order')
    .order('sort_order')
  if (error) throw error
  return data
}

export interface ArticleFilters {
  search: string
  categoryId: string | 'all'
  status: ArticleStatus | 'all'
  page: number
}

export async function fetchArticles(
  filters: ArticleFilters,
): Promise<{ items: ArticleListItem[]; total: number }> {
  const from = filters.page * PAGE_SIZE

  let query = supabase
    .from('articles')
    .select(
      'id, title, slug, summary, status, view_count, created_at, updated_at, category:categories(id, name, slug)',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId)
  if (filters.search.trim()) {
    // Escape characters that have a special meaning inside a PostgREST filter string.
    const term = filters.search.trim().replace(/[%,()*]/g, ' ')
    query = query.ilike('title', `%${term}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { items: data as unknown as ArticleListItem[], total: count ?? 0 }
}

export async function fetchArticle(id: string): Promise<Article> {
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Article
}

const UNIQUE_VIOLATION = '23505'

/** Creates an article. The slug comes from the title; on a clash we append a short random suffix. */
export async function createArticle(input: ArticleInput, authorId: string): Promise<Article> {
  const base = slugify(input.title) || 'artikel'

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('articles')
      .insert({ ...input, slug, author_id: authorId })
      .select('*')
      .single()
    if (!error) return data as Article
    if (error.code !== UNIQUE_VIOLATION) throw error
  }
  throw new Error('Could not generate a unique slug')
}

/** Updates an article. The slug is kept stable on purpose so existing links keep working. */
export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Article
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}
