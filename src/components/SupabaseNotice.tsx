import { TriangleAlert } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'

/** Dev-only hint shown while `.env.local` has no Supabase credentials yet. */
export function SupabaseNotice() {
  if (isSupabaseConfigured || !import.meta.env.DEV) return null

  return (
    <div className="flex items-center justify-center gap-2 border-b border-warn/30 bg-warn-soft px-4 py-2 text-[13px] text-warn">
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      <span>
        Supabase ist nicht konfiguriert – trage URL und Anon-Key in <code>.env.local</code> ein.
      </span>
    </div>
  )
}
