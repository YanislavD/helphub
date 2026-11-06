import { useQuery } from '@tanstack/react-query'
import {
  fetchOverview,
  fetchRatings,
  fetchTimeseries,
  fetchTopQueries,
  fetchUnansweredQueries,
  fetchViewsByCategory,
} from './api'

// Dashboard numbers change slowly – a minute of caching keeps switching periods snappy.
const staleTime = 60_000

export function useOverview(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'overview', days],
    queryFn: () => fetchOverview(days),
    staleTime,
  })
}

export function useTimeseries(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'timeseries', days],
    queryFn: () => fetchTimeseries(days),
    staleTime,
  })
}

export function useTopQueries(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'top', days],
    queryFn: () => fetchTopQueries(days),
    staleTime,
  })
}

export function useUnansweredQueries(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'unanswered', days],
    queryFn: () => fetchUnansweredQueries(days),
    staleTime,
  })
}

export function useRatings() {
  return useQuery({ queryKey: ['dashboard', 'ratings'], queryFn: fetchRatings, staleTime })
}

export function useViewsByCategory() {
  return useQuery({ queryKey: ['dashboard', 'views'], queryFn: fetchViewsByCategory, staleTime })
}
