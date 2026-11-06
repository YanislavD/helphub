import { describe, expect, it } from 'vitest'
import { cn } from './cn'
import { formatDate, readingMinutes } from './format'

describe('readingMinutes', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'wort').join(' ')

  it('is at least one minute, even for empty text', () => {
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes(words(30))).toBe(1)
  })

  it('assumes about 200 words per minute', () => {
    expect(readingMinutes(words(400))).toBe(2)
    expect(readingMinutes(words(1000))).toBe(5)
  })
})

describe('formatDate', () => {
  it('formats German dates as dd.mm.yyyy', () => {
    expect(formatDate('2026-11-06T12:00:00Z')).toBe('06.11.2026')
  })
})

describe('cn', () => {
  it('joins class names and ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
    const isHidden = false as boolean
    expect(cn('a', isHidden && 'hidden', 'c')).toBe('a c')
  })
})
