import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/** The platform hands every function its keys as env vars. New projects use JSON dictionaries
 *  (SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS, key name "default"); older ones the legacy vars. */
function readKey(dictVar: string, legacyVar: string): string {
  const dict = Deno.env.get(dictVar)
  if (dict) {
    try {
      const parsed = JSON.parse(dict) as Record<string, string>
      if (parsed.default) return parsed.default
      const first = Object.values(parsed)[0]
      if (first) return first
    } catch {
      /* fall through to the legacy variable */
    }
  }
  const legacy = Deno.env.get(legacyVar)
  if (!legacy) throw new Error(`Missing ${dictVar} / ${legacyVar}`)
  return legacy
}

export interface AuthContext {
  userId: string
  role: 'user' | 'agent' | 'admin'
  /** Acts AS the caller: Row Level Security applies. Use for everything the user may do themselves. */
  userClient: SupabaseClient
  /** Service role: bypasses RLS. Only use after you have checked the caller's permissions. */
  adminClient: SupabaseClient
}

/**
 * Authenticates the request.
 *
 * We switched off the platform's `verify_jwt` check (it doesn't understand the new API keys), so
 * THIS is the gate: the caller must send a valid user access token. `auth.getUser(token)` asks the
 * Supabase Auth server to validate it – we never trust a token we haven't verified.
 */
export async function authenticate(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!authHeader || !token) throw new HttpError(401, 'Missing access token')

  const url = Deno.env.get('SUPABASE_URL')!
  const publishableKey = readKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Invalid access token')

  // The profile is readable by its owner (RLS), so the user's own client can fetch the role.
  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()
  if (profileError || !profile) throw new HttpError(403, 'No profile for this user')

  const adminClient = createClient(url, readKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  return { userId: data.user.id, role: profile.role, userClient, adminClient }
}
