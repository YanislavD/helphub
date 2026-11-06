import { describe, expect, it } from 'vitest'
import { safeFileName } from './safe-file-name'

describe('safeFileName', () => {
  it('lower-cases, replaces unusual characters and keeps the extension', () => {
    expect(safeFileName('Mein Bild (1).PNG')).toBe('mein-bild-1.png')
    expect(safeFileName('Fehlermeldung Drucker.pdf')).toBe('fehlermeldung-drucker.pdf')
  })

  it('uses a fallback when no usable characters are left', () => {
    expect(safeFileName('ÄÖÜ.pdf')).toBe('datei.pdf')
    expect(safeFileName('!!!')).toBe('datei')
  })

  it('keeps only the last extension', () => {
    expect(safeFileName('backup.tar.gz')).toBe('backup-tar.gz')
  })

  it('never produces path separators or dot-dot sequences', () => {
    for (const evil of [
      '../../etc/passwd',
      '..\\..\\windows\\system32',
      'a/b/c.png',
      '.htaccess',
    ]) {
      const result = safeFileName(evil)
      expect(result).toMatch(/^[a-z0-9.-]+$/)
      expect(result).not.toContain('..')
    }
  })

  it('limits very long names', () => {
    expect(safeFileName('x'.repeat(300) + '.png').length).toBeLessThanOrEqual(60 + 1 + 8)
  })
})
