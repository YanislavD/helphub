import { QueryClient } from '@tanstack/react-query'

// TanStack Query caches server data (articles, search results…) so the UI doesn't refetch
// on every click. staleTime = how long cached data counts as "fresh".
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
