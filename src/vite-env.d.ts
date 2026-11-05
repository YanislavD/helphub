/// <reference types="vite/client" />

// Typed access to our env variables. Vite only exposes variables that start with VITE_
// to the browser – anything else stays server-side. That's why the service_role key
// must NEVER get a VITE_ prefix (it only lives in Edge Functions).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
