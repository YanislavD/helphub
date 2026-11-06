import { useQuery } from '@tanstack/react-query'
import {
  fetchAuthorName,
  fetchCategoryCounts,
  fetchPublishedArticleBySlug,
  fetchPublishedArticles,
  fetchRelatedArticles,
  type PublishedListOptions,
} from './portal-api'

export function usePublishedArticles(options: PublishedListOptions) {
  return useQuery({
    queryKey: ['articles', 'list', 'published', options],
    queryFn: () => fetchPublishedArticles(options),
  })
}

export function usePublishedArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'detail', 'slug', slug],
    queryFn: () => fetchPublishedArticleBySlug(slug!),
    enabled: Boolean(slug),
  })
}

export function useRelatedArticles(categoryId: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'related', categoryId, excludeId],
    queryFn: () => fetchRelatedArticles(categoryId!, excludeId!),
    enabled: Boolean(categoryId && excludeId),
  })
}

export function useCategoryCounts() {
  return useQuery({ queryKey: ['categories', 'counts'], queryFn: fetchCategoryCounts })
}

export function useAuthorName(authorId: string | null | undefined) {
  return useQuery({
    queryKey: ['author-name', authorId],
    queryFn: () => fetchAuthorName(authorId!),
    enabled: Boolean(authorId),
    staleTime: 30 * 60_000,
  })
}
