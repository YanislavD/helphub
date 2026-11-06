// Pure helpers for the admin screens (kept free of React/Supabase so they are easy to test).

import type { Role } from '@/features/auth/types'

/** Swaps a category with its neighbour; returns the ids in the new order (unchanged at the edges). */
export function moveItem(ids: string[], id: string, direction: 'up' | 'down'): string[] {
  const index = ids.indexOf(id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** Friendly German text for the database errors the admin screens can run into. */
export function adminErrorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string } | null
  const message = e?.message ?? ''

  if (e?.code === '23505') return 'Dieser Name oder diese Adresse (Slug) ist schon vergeben.'
  if (e?.code === '23503') {
    return 'Diese Kategorie enthält noch Artikel. Verschiebe oder lösche sie zuerst.'
  }
  if (message.includes('at least one admin')) return 'Es muss mindestens ein Admin bleiben.'
  if (e?.code === '42501') return 'Dafür fehlt dir die Berechtigung.'
  return 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.'
}

export interface AdminUserLike {
  full_name: string
  email: string
  role: Role
}

/** Search box + role filter of the user table (case-insensitive, matches name and e-mail). */
export function filterUsers<T extends AdminUserLike>(
  users: T[],
  search: string,
  role: Role | 'all',
): T[] {
  const term = search.trim().toLowerCase()
  return users.filter((user) => {
    if (role !== 'all' && user.role !== role) return false
    if (!term) return true
    return user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
  })
}
