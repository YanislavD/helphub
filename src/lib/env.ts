const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once the developer has put real Supabase credentials into `.env.local`. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const env = {
  // Placeholders keep the UI usable before a Supabase project exists.
  // Every real request will simply fail until `.env.local` is filled in.
  supabaseUrl: url ?? 'http://localhost:54321',
  supabaseAnonKey: anonKey ?? 'missing-anon-key',
}
