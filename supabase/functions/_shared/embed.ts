import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// `Supabase.ai` is a global provided by the Edge Runtime – it runs the gte-small model inside
// the function, for free, with no external API. (Declared here only for type-checking.)
declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run(
        input: string,
        options: { mean_pool: boolean; normalize: boolean },
      ): Promise<ArrayLike<number>>
    }
  }
}

// Created once per function instance, not per request: loading the model is the slow part
// (the first request after a cold start takes a few seconds, later ones are fast).
let session: InstanceType<typeof Supabase.ai.Session> | null = null

/**
 * Text → vector with 384 numbers.
 *  - mean_pool: average the per-token vectors into ONE vector for the whole text
 *  - normalize: scale it to length 1, so cosine similarity is a plain dot product
 * Inputs longer than ~512 tokens are truncated by the model, which is why we chunk articles.
 */
export async function embed(text: string): Promise<number[]> {
  session ??= new Supabase.ai.Session('gte-small')
  const output = await session.run(text, { mean_pool: true, normalize: true })
  return Array.from(output)
}

/** pgvector accepts vectors as text like "[0.1,0.2,…]". */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}
