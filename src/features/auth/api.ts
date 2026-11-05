import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from './types'

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/**
 * Creates the auth user. `full_name` travels in the user metadata; the database trigger
 * `handle_new_user` copies it into `profiles`.
 * Returns `needsConfirmation: true` when the project requires e-mail confirmation
 * (Supabase then creates the user but returns no session yet).
 */
export async function signUp(fullName: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return { needsConfirmation: data.session === null }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/** Turns Supabase's English error codes into friendly German messages. */
export function authErrorMessage(error: unknown): string {
  const code = (error as Partial<AuthError> | null)?.code
  switch (code) {
    case 'invalid_credentials':
      return 'E-Mail oder Passwort ist falsch.'
    case 'email_not_confirmed':
      return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.'
    case 'weak_password':
      return 'Das Passwort ist zu schwach. Nimm mindestens 8 Zeichen.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.'
    default:
      return 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.'
  }
}
