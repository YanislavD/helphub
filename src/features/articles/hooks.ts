import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createArticle,
  deleteArticle,
  fetchArticle,
  fetchArticles,
  fetchCategories,
  updateArticle,
  type ArticleFilters,
} from './api'
import type { ArticleInput } from './types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60_000, // categories almost never change
  })
}

export function useArticles(filters: ArticleFilters) {
  return useQuery({
    queryKey: ['articles', 'list', filters],
    queryFn: () => fetchArticles(filters),
    placeholderData: keepPreviousData, // keep showing the old page while the next one loads
  })
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'detail', id],
    queryFn: () => fetchArticle(id!),
    enabled: Boolean(id),
  })
}

export function useSaveArticle(authorId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ArticleInput }) =>
      id ? updateArticle(id, input) : createArticle(input, authorId!),
    onSuccess: (saved) => {
      // We already have the fresh article – put it in the cache so the editor doesn't refetch…
      queryClient.setQueryData(['articles', 'detail', saved.id], saved)
      // …and mark every list as outdated so it reloads next time it is shown.
      void queryClient.invalidateQueries({ queryKey: ['articles', 'list'] })
    },
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}
