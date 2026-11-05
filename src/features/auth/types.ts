export type Role = 'user' | 'agent' | 'admin'

/** Mirrors the `public.profiles` table (see supabase/migrations). */
export interface Profile {
  id: string
  full_name: string
  role: Role
}

export const roleLabels: Record<Role, string> = {
  user: 'Mitarbeiter',
  agent: 'IT-Agent',
  admin: 'Admin',
}
