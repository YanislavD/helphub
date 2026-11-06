import { describe, expect, it } from 'vitest'
import { STRONG_SIMILARITY, relevanceTier } from './relevance'

const base = { ftsRank: null, similarity: null, rank: 0.02, bestRank: 0.03 }

describe('relevanceTier – hybrid search', () => {
  it('is "high" when the meaning is a strong match AND keywords found it too', () => {
    expect(relevanceTier({ ...base, ftsRank: 1, similarity: 0.9 }, true)).toBe('high')
  })

  it('is "medium" for a strong match found only by meaning', () => {
    expect(relevanceTier({ ...base, similarity: 0.88 }, true)).toBe('medium')
  })

  it('is "low" when the similarity is weak, even if keywords matched', () => {
    expect(relevanceTier({ ...base, ftsRank: 1, similarity: 0.85 }, true)).toBe('low')
  })

  it('treats the threshold itself as strong', () => {
    expect(relevanceTier({ ...base, ftsRank: 1, similarity: STRONG_SIMILARITY }, true)).toBe('high')
  })

  it('rates keyword-only hits by their position in the keyword list', () => {
    expect(relevanceTier({ ...base, ftsRank: 2 }, true)).toBe('medium')
    expect(relevanceTier({ ...base, ftsRank: 6 }, true)).toBe('low')
  })
})

describe('relevanceTier – keyword-only fallback', () => {
  it('is relative to the best hit of the same search', () => {
    expect(relevanceTier({ ...base, rank: 0.03, bestRank: 0.03 }, false)).toBe('high')
    expect(relevanceTier({ ...base, rank: 0.015, bestRank: 0.03 }, false)).toBe('medium')
    expect(relevanceTier({ ...base, rank: 0.005, bestRank: 0.03 }, false)).toBe('low')
  })

  it('does not divide by zero', () => {
    expect(relevanceTier({ ...base, rank: 0, bestRank: 0 }, false)).toBe('low')
  })
})
