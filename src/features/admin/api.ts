import type { Category } from '@/features/articles/types'
import type { Role } from '@/features/auth/types'
import { slugify } from '@/lib/slugify'
import { supabase } from '@/lib/supabase'

/*
 * Admin-only data access. Everything here is protected by the database (RLS policies on `categories` and
 * `profiles`, plus the admin_list_users() function) – the route guard only hides screens.
 */

export interface CategoryInput {
  name: string
  slug: string
  icon: string
}

/** Number of ALL articles (drafts included) per category id – used to explain why one can't be deleted. */
export async function fetchArticleCountsByCategory(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('articles').select('category_id')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
  return counts
}

export async function createCategory(input: CategoryInput, sortOrder: number): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name.trim(),
      slug: slugify(input.slug),
      icon: input.icon,
      sort_order: sortOrder,
    })
    .select('id, name, slug, icon, sort_order')
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name: input.name.trim(), slug: slugify(input.slug), icon: input.icon })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

/** Writes the new order: position in the list becomes sort_order (1, 2, 3 …). */
export async function saveCategoryOrder(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index + 1 })
        .eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: Role
  created_at: string
  last_sign_in_at: string | null
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return data as AdminUser[]
}

export async function changeUserRole(userId: string, role: Role): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id')
  if (error) throw error
  // RLS hides rows from non-admins instead of raising an error, so "0 rows" means "not allowed".
  if (data.length === 0) throw { code: '42501' }
}
