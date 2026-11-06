import { describe, expect, it } from 'vitest'
import { adminErrorMessage, filterUsers, moveItem } from './utils'

describe('moveItem', () => {
  const ids = ['a', 'b', 'c']

  it('moves an item up or down by one position', () => {
    expect(moveItem(ids, 'b', 'up')).toEqual(['b', 'a', 'c'])
    expect(moveItem(ids, 'b', 'down')).toEqual(['a', 'c', 'b'])
  })

  it('does nothing at the edges (returns the very same array)', () => {
    expect(moveItem(ids, 'a', 'up')).toBe(ids)
    expect(moveItem(ids, 'c', 'down')).toBe(ids)
  })

  it('ignores unknown ids and does not modify the input', () => {
    expect(moveItem(ids, 'x', 'up')).toBe(ids)
    moveItem(ids, 'a', 'down')
    expect(ids).toEqual(['a', 'b', 'c'])
  })
})

describe('adminErrorMessage', () => {
  it('explains a duplicate name or slug', () => {
    expect(adminErrorMessage({ code: '23505' })).toContain('schon vergeben')
  })

  it('explains why a category with articles cannot be deleted', () => {
    expect(adminErrorMessage({ code: '23503' })).toContain('enthält noch Artikel')
  })

  it('explains the last-admin protection', () => {
    expect(adminErrorMessage({ code: 'P0001', message: 'at least one admin must remain' })).toBe(
      'Es muss mindestens ein Admin bleiben.',
    )
  })

  it('handles missing permissions and unknown errors', () => {
    expect(adminErrorMessage({ code: '42501' })).toContain('Berechtigung')
    expect(adminErrorMessage(null)).toContain('nicht geklappt')
    expect(adminErrorMessage(new Error('boom'))).toContain('nicht geklappt')
  })
})

describe('filterUsers', () => {
  const users = [
    {
      full_name: 'Anna Weber',
      email: 'anna.weber@mueller-logistik.example',
      role: 'user' as const,
    },
    {
      full_name: 'Jonas Keller',
      email: 'jonas.keller@mueller-logistik.example',
      role: 'agent' as const,
    },
    {
      full_name: 'Sabine Hoffmann',
      email: 'sabine.hoffmann@mueller-logistik.example',
      role: 'admin' as const,
    },
  ]

  it('returns everybody without filters', () => {
    expect(filterUsers(users, '', 'all')).toHaveLength(3)
  })

  it('searches name and e-mail, ignoring case and spaces around the term', () => {
    expect(filterUsers(users, '  KELLER ', 'all').map((u) => u.full_name)).toEqual(['Jonas Keller'])
    expect(filterUsers(users, 'sabine.hoffmann@', 'all')).toHaveLength(1)
  })

  it('filters by role and combines with the search', () => {
    expect(filterUsers(users, '', 'agent').map((u) => u.full_name)).toEqual(['Jonas Keller'])
    expect(filterUsers(users, 'anna', 'admin')).toEqual([])
  })
})
