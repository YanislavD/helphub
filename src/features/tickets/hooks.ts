import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTicket, fetchMyTickets } from './api'
import type { TicketInput } from './types'

export function useMyTickets() {
  return useQuery({ queryKey: ['tickets', 'mine'], queryFn: fetchMyTickets })
}

export function useCreateTicket(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, file }: { input: TicketInput; file: File | null }) =>
      createTicket(input, userId!, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}
