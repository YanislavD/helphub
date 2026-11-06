export type RelevanceTier = 'high' | 'medium' | 'low'

interface TierInput {
  /** Position in the keyword result list (null = not found by keywords). */
  ftsRank: number | null
  /** Position in the semantic result list (null = not found by meaning). */
  semRank: number | null
  /** Raw ranking score and the best score of the same search (used when only keyword search ran). */
  rank: number
  bestRank: number
}

/**
 * How much evidence do we have that a hit answers the question?
 *  - hybrid search: found by keywords AND by meaning = strong; by one of them near the top = medium;
 *    anything else = weak. (Embedding similarities of gte-small are too compressed for German to be
 *    shown as a percentage, so we show levels based on agreement of both searches.)
 *  - keyword-only fallback: relative to the best hit of that search.
 */
export function relevanceTier(
  { ftsRank, semRank, rank, bestRank }: TierInput,
  hybrid: boolean,
): RelevanceTier {
  if (hybrid) {
    if (ftsRank !== null && semRank !== null) return 'high'
    if ((ftsRank !== null && ftsRank <= 3) || (semRank !== null && semRank <= 3)) return 'medium'
    return 'low'
  }
  const relative = bestRank > 0 ? rank / bestRank : 0
  if (relative >= 0.75) return 'high'
  if (relative >= 0.4) return 'medium'
  return 'low'
}

export const tierLabels: Record<RelevanceTier, string> = {
  high: 'Sehr relevant',
  medium: 'Relevant',
  low: 'Möglicherweise relevant',
}

export const tierBars: Record<RelevanceTier, number> = { high: 5, medium: 3, low: 1 }
