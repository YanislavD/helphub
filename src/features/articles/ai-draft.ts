import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AiDraft {
  title: string
  summary: string
  category_slug: string | null
  tags: string[]
  content: string
}

export const MIN_DESCRIPTION = 20
export const MAX_DESCRIPTION = 4000

/** An error whose message is safe and meant to be shown to the agent as it is. */
export class DraftError extends Error {}

/**
 * Asks the `draft-article` Edge Function (Groq language model) to turn a free-text description into
 * an article draft. Nothing is saved – the caller puts the draft into the editor for review.
 */
export async function generateArticleDraft(
  description: string,
  titleHint?: string,
): Promise<AiDraft> {
  const { data, error } = await supabase.functions.invoke<{ draft: AiDraft }>('draft-article', {
    body: { description, title_hint: titleHint },
  })

  if (error) {
    // For non-2xx answers supabase-js gives us the raw Response; our function puts a German
    // message into { error: "…" } – show that instead of a generic failure.
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { error?: string } | null
      if (body?.error) throw new DraftError(body.error)
    }
    throw new DraftError('Der Entwurf konnte nicht erstellt werden. Bitte versuche es erneut.')
  }
  if (!data?.draft) throw new DraftError('Die KI hat keinen Entwurf geliefert.')
  return data.draft
}
