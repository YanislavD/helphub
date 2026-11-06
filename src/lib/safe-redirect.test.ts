import { describe, expect, it } from 'vitest'
import { safeRedirect } from './safe-redirect'

describe('safeRedirect (blocks open redirects)', () => {
  it('keeps normal in-app paths, including query and hash', () => {
    expect(safeRedirect('/agent')).toBe('/agent')
    expect(safeRedirect('/search?q=vpn%20fehler&category=hardware')).toBe(
      '/search?q=vpn%20fehler&category=hardware',
    )
    expect(safeRedirect('/articles/abc#schritte')).toBe('/articles/abc#schritte')
  })

  it('falls back to "/" when there is no redirect', () => {
    expect(safeRedirect(null)).toBe('/')
    expect(safeRedirect('')).toBe('/')
  })

  it.each([
    'https://evil.example',
    'http://evil.example/login',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'agent',
    '/path\nwith-newline',
    '/x\u0000',
  ])('rejects %j', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})
