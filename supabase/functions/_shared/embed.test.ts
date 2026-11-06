import { describe, expect, it, vi } from 'vitest'
import { embedTexts, normalize, parseEmbeddings, toVectorLiteral } from './embed'

const vec = (value: number) => Array.from({ length: 384 }, () => value)
const ok = (count: number) =>
  new Response(
    JSON.stringify({ embeddings: Array.from({ length: count }, () => ({ values: vec(2) })) }),
  )

describe('normalize', () => {
  it('scales a vector to length 1', () => {
    const n = normalize([3, 4])
    expect(n[0]).toBeCloseTo(0.6)
    expect(n[1]).toBeCloseTo(0.8)
  })

  it('leaves the zero vector alone', () => {
    expect(normalize([0, 0])).toEqual([0, 0])
  })
})

describe('parseEmbeddings', () => {
  it('returns normalized vectors', () => {
    const [v] = parseEmbeddings({ embeddings: [{ values: vec(2) }] }, 1)
    expect(Math.hypot(...v)).toBeCloseTo(1)
  })

  it('rejects a wrong count or size', () => {
    expect(() => parseEmbeddings({ embeddings: [] }, 1)).toThrow()
    expect(() => parseEmbeddings({ embeddings: [{ values: [1, 2] }] }, 1)).toThrow()
    expect(() => parseEmbeddings(null, 1)).toThrow()
  })
})

describe('embedTexts', () => {
  it('needs an API key', async () => {
    await expect(embedTexts(['a'], 'RETRIEVAL_QUERY', undefined)).rejects.toThrow('GEMINI_API_KEY')
  })

  it('sends one request with task type and dimensions', async () => {
    const fetchFn = vi.fn().mockResolvedValue(ok(2))
    const result = await embedTexts(['a', 'b'], 'RETRIEVAL_DOCUMENT', 'key', fetchFn)
    expect(result).toHaveLength(2)
    expect(fetchFn).toHaveBeenCalledOnce()
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('batchEmbedContents')
    const body = JSON.parse(init.body as string)
    expect(body.requests).toHaveLength(2)
    expect(body.requests[0]).toMatchObject({
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 384,
    })
    expect(init.headers['x-goog-api-key']).toBe('key')
  })

  it('waits and retries on 429, then succeeds', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
      .mockResolvedValueOnce(ok(1))
    const sleep = vi.fn().mockResolvedValue(undefined)
    await embedTexts(['a'], 'RETRIEVAL_QUERY', 'key', fetchFn, sleep)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledOnce()
  })

  it('does not retry a client error such as a wrong key', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('bad key', { status: 400 }))
    await expect(embedTexts(['a'], 'RETRIEVAL_QUERY', 'key', fetchFn)).rejects.toThrow('HTTP 400')
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('gives up after the last retry', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('busy', { status: 429 }))
    const sleep = vi.fn().mockResolvedValue(undefined)
    await expect(embedTexts(['a'], 'RETRIEVAL_QUERY', 'key', fetchFn, sleep)).rejects.toThrow(
      'HTTP 429',
    )
    expect(fetchFn).toHaveBeenCalledTimes(4)
  })
})

describe('toVectorLiteral', () => {
  it('formats a pgvector literal', () => {
    expect(toVectorLiteral([1, 2.5])).toBe('[1,2.5]')
  })
})
