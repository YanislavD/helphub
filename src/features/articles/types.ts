export type ArticleStatus = 'draft' | 'published'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
}

/** A row of `public.articles` (without the Markdown body – used in lists). */
export interface ArticleListItem {
  id: string
  title: string
  slug: string
  summary: string
  status: ArticleStatus
  view_count: number
  created_at: string
  updated_at: string
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
}

/** A full article including the Markdown body – used by the editor and the reader. */
export interface Article extends Omit<ArticleListItem, 'category'> {
  content: string
  tags: string[]
  category_id: string
  author_id: string | null
  published_at: string | null
}

/** What the editor form sends to the database. */
export interface ArticleInput {
  title: string
  summary: string
  content: string
  category_id: string
  tags: string[]
  status: ArticleStatus
}
