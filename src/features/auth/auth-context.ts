import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'
import type { Profile, Role } from './types'

export interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: Role | null
  /** true until we know whether someone is signed in (and, if so, which role they have) */
  loading: boolean
}

export const AuthContext = createContext<AuthState | null>(null)
