// Text → vector, using Google's free Gemini embedding model.
//
// Why not the built-in gte-small any more? It is trained mostly on English: with ~80 German
// articles all similarities lay in a narrow band (0.83–0.90) and unrelated articles scored as high
// as correct ones. gemini-embedding-001 is multilingual and separates German topics far better.
//
// Pure TypeScript (no Deno APIs; the API key and `fetch` are passed in) so it can be unit-tested.

export const EMBEDDING_MODEL = 'gemini-embedding-001'

/**
 * The column article_chunks.embedding is vector(384). The model supports shorter vectors
 * ("Matryoshka" training: the first N numbers already carry most of the meaning), so we ask for 384
 * and need no database change. Shorter vectors from this model are NOT normalized by Google.
 */
export const EMBEDDING_DIMENSIONS = 384

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}`

/** RETRIEVAL_QUERY for the user's question, RETRIEVAL_DOCUMENT for article chunks: the model embeds the two differently on purpose. */
export type EmbeddingTask = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

/** Scales a vector to length 1, so cosine similarity is a plain dot product (what pgvector expects). */
export function normalize(vector: number[]): number[] {
  const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0))
  return length === 0 ? vector : vector.map((x) => x / length)
}

/** Picks the vectors out of a batchEmbedContents answer and normalizes them. */
export function parseEmbeddings(body: unknown, expected: number): number[][] {
  const embeddings = (body as { embeddings?: Array<{ values?: unknown }> } | null)?.embeddings
  if (!Array.isArray(embeddings) || embeddings.length !== expected) {
    throw new Error('Unexpected embedding response')
  }
  return embeddings.map((e) => {
    if (
      !Array.isArray(e.values) ||
      e.values.length !== EMBEDDING_DIMENSIONS ||
      e.values.some((x) => typeof x !== 'number')
    ) {
      throw new Error('Unexpected embedding size')
    }
    return normalize(e.values as number[])
  })
}

const RETRY_DELAYS_MS = [1500, 4000, 8000]

/** Embeds several texts in ONE request. Waits and retries when the free quota says "slow down" (429). */
export async function embedTexts(
  texts: string[],
  task: EmbeddingTask,
  apiKey: string | undefined,
  fetchFn: FetchFn = fetch,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<number[][]> {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  if (texts.length === 0) return []

  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType: task,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })),
  })

  for (let attempt = 0; ; attempt++) {
    const response = await fetchFn(`${ENDPOINT}:batchEmbedContents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
    })
    if (response.ok) return parseEmbeddings(await response.json(), texts.length)

    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt >= RETRY_DELAYS_MS.length) {
      throw new Error(`Embedding request failed (HTTP ${response.status})`)
    }
    await sleep(RETRY_DELAYS_MS[attempt])
  }
}

/** The user's question. */
export async function embedQuery(text: string, apiKey: string | undefined): Promise<number[]> {
  return (await embedTexts([text], 'RETRIEVAL_QUERY', apiKey))[0]
}

/** Article chunks (all in one request). */
export function embedDocuments(texts: string[], apiKey: string | undefined): Promise<number[][]> {
  return embedTexts(texts, 'RETRIEVAL_DOCUMENT', apiKey)
}

/** pgvector accepts vectors as text like "[0.1,0.2,…]". */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}
