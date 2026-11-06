import { useQuery } from '@tanstack/react-query'
import { searchArticles } from './search-api'

/**
 * The query function both searches AND logs the search. TanStack Query runs it once per
 * distinct query (and caches the result), so reloading/re-rendering doesn't spam the log.
 */
export function useSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchArticles(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60_000,
  })
}
