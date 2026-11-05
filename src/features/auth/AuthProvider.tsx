import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthState } from './auth-context'
import { fetchProfile } from './api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    // Supabase calls this immediately with the stored session (INITIAL_SESSION) and again on
    // every sign-in, sign-out and token refresh – so this one subscription is all we need.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  // The profile (role!) lives in our own table, so it is a normal data query.
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  })

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: userId ? (profileQuery.data ?? null) : null,
      role: userId ? (profileQuery.data?.role ?? null) : null,
      loading: sessionLoading || (Boolean(userId) && profileQuery.isPending),
    }),
    [session, userId, sessionLoading, profileQuery.data, profileQuery.isPending],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
