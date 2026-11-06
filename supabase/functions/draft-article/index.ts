// Edge Function: drafts a knowledge-base article from a free-text description of a solution.
//
//   POST { "description": "Gestern hatte ein Kollege ein Problem mit …", "title_hint": "optional" }
//   → { "draft": { title, summary, category_slug, tags, content }, "model": "…" }
//
// Only agents and admins may call it. The draft is NOT saved: the editor shows it, a human reviews and
// edits it, and only then it becomes an article (status "draft" until someone publishes it).
//
// The language model is Groq's free tier (OpenAI-compatible API). The key lives in the Edge Function
// secret GROQ_API_KEY – it never reaches the browser:
//     npx supabase secrets set GROQ_API_KEY=<your key>
// Optional: GROQ_MODEL (default llama-3.3-70b-versatile) in case Groq retires a model.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { authenticate, HttpError } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import {
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  buildSystemPrompt,
  buildUserPrompt,
  parseDraft,
} from '../_shared/draft.ts'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function askModel(
  system: string,
  user: string,
  apiKey: string,
  model: string,
): Promise<string> {
  // Without a timeout a slow provider could keep the request hanging until the platform kills it.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 40_000)

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3, // low = sticks to the facts instead of getting creative
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (response.status === 429)
      throw new HttpError(
        429,
        'Die KI ist gerade ausgelastet. Bitte versuche es in einer Minute erneut.',
      )
    if (response.status === 401 || response.status === 403) {
      console.error('Groq rejected the API key', response.status)
      throw new HttpError(503, 'Der KI-Dienst ist nicht richtig eingerichtet (API-Schlüssel).')
    }
    if (!response.ok) {
      console.error('Groq error', response.status, await response.text())
      throw new HttpError(502, 'Der KI-Dienst hat nicht geantwortet. Bitte versuche es erneut.')
    }

    const body = await response.json()
    const text = body?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text)
      throw new HttpError(502, 'Die KI hat keine Antwort geliefert.')
    return text
  } catch (error) {
    if (error instanceof HttpError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new HttpError(504, 'Die KI hat zu lange gebraucht. Bitte versuche es erneut.')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { role, userClient } = await authenticate(req)
    if (role !== 'agent' && role !== 'admin') {
      throw new HttpError(403, 'Only agents and admins can generate article drafts')
    }

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey)
      throw new HttpError(503, 'Der KI-Dienst ist noch nicht eingerichtet (GROQ_API_KEY fehlt).')

    const body = (await req.json().catch(() => ({}))) as {
      description?: unknown
      title_hint?: unknown
    }
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (description.length < MIN_DESCRIPTION) {
      throw new HttpError(
        400,
        `Bitte beschreibe die Lösung etwas ausführlicher (mindestens ${MIN_DESCRIPTION} Zeichen).`,
      )
    }
    if (description.length > MAX_DESCRIPTION) {
      throw new HttpError(
        400,
        `Die Beschreibung ist zu lang (höchstens ${MAX_DESCRIPTION} Zeichen).`,
      )
    }
    const titleHint =
      typeof body.title_hint === 'string' ? body.title_hint.slice(0, 200) : undefined

    const { data: categories, error } = await userClient
      .from('categories')
      .select('slug, name')
      .order('sort_order')
    if (error) throw error

    const model = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile'
    const raw = await askModel(
      buildSystemPrompt(categories),
      buildUserPrompt(description, titleHint),
      apiKey,
      model,
    )

    const draft = parseDraft(
      raw,
      categories.map((c) => c.slug),
    )
    if (!draft)
      throw new HttpError(502, 'Die KI-Antwort war nicht brauchbar. Bitte versuche es noch einmal.')

    return json({ draft, model })
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error('draft-article failed', error)
    return json({ error: 'Der Entwurf konnte nicht erstellt werden.' }, 500)
  }
})
