import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * The single Supabase client for the whole frontend.
 *
 * It uses the *anon* key, which is safe to ship to the browser: what a user may actually
 * read or write is decided by Row Level Security policies in the database, not by hiding the key.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
