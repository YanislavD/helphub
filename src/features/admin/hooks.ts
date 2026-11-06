import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/features/auth/types'
import {
  changeUserRole,
  createCategory,
  deleteCategory,
  fetchArticleCountsByCategory,
  fetchUsers,
  saveCategoryOrder,
  updateCategory,
  type CategoryInput,
} from './api'

export function useArticleCounts() {
  return useQuery({ queryKey: ['admin', 'article-counts'], queryFn: fetchArticleCountsByCategory })
}

/** After any category change the cached category lists (portal, editor, filters) are outdated. */
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'article-counts'] }),
    ])
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ input, sortOrder }: { input: CategoryInput; sortOrder: number }) =>
      createCategory(input, sortOrder),
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) => updateCategory(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: deleteCategory, onSuccess: invalidate })
}

export function useSaveCategoryOrder() {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: saveCategoryOrder, onSuccess: invalidate })
}

export function useUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers })
}

export function useChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => changeUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
