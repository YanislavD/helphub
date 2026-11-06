import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMyFeedback,
  fetchFeedbackStats,
  fetchFeedbackSummary,
  fetchMyFeedback,
  saveFeedback,
} from './api'

export function useMyFeedback(articleId: string | undefined) {
  return useQuery({
    queryKey: ['feedback', 'mine', articleId],
    queryFn: () => fetchMyFeedback(articleId!),
    enabled: Boolean(articleId),
  })
}

export function useFeedbackStats(articleId: string | undefined) {
  return useQuery({
    queryKey: ['feedback', 'stats', articleId],
    queryFn: () => fetchFeedbackStats(articleId!),
    enabled: Boolean(articleId),
  })
}

export function useFeedbackSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['feedback', 'summary'],
    queryFn: fetchFeedbackSummary,
    enabled,
  })
}

export function useSaveFeedback(articleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ helpful, comment }: { helpful: boolean; comment: string }) =>
      saveFeedback(articleId, helpful, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  })
}

export function useDeleteFeedback(articleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteMyFeedback(articleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  })
}
