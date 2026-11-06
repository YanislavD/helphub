export type RelevanceTier = 'high' | 'medium' | 'low'

/**
 * Cosine similarity from which a semantic hit counts as "strong".
 *
 * Calibrated on 2026-11-06 with the 18 test questions of /admin/search-quality (27 articles):
 *  - the correct top hit of the 15 answerable questions had similarity 0.864 – 0.941
 *  - the top hit of the 3 unanswerable questions had 0.827 – 0.854
 * gte-small is English-centric, so German similarities are compressed and this margin is narrow
 * (~0.01). Re-run the test page and re-check this value whenever articles or the model change.
 */
export const STRONG_SIMILARITY = 0.86

interface TierInput {
  /** Position in the keyword result list (null = not found by keywords). */
  ftsRank: number | null
  /** Cosine similarity of the best matching chunk (null = not in the semantic list). */
  similarity: number | null
  /** Raw ranking score and the best score of the same search (used when only keyword search ran). */
  rank: number
  bestRank: number
}

/**
 * How much evidence do we have that a hit answers the question?
 *  - hybrid search: a semantic hit with a strong similarity is the main evidence; if the keyword
 *    search found it too, even better ("high"). Weak similarity = "low", however it was found.
 *    Hits found only by keywords are "medium" near the top of that list.
 *  - keyword-only fallback (AI unavailable): relative to the best hit of that search.
 */
export function relevanceTier(
  { ftsRank, similarity, rank, bestRank }: TierInput,
  hybrid: boolean,
): RelevanceTier {
  if (hybrid) {
    if (similarity !== null) {
      if (similarity < STRONG_SIMILARITY) return 'low'
      return ftsRank !== null ? 'high' : 'medium'
    }
    return ftsRank !== null && ftsRank <= 3 ? 'medium' : 'low'
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
