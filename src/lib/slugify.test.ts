import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lower-cases and joins words with dashes', () => {
    expect(slugify('VPN verbindet nicht')).toBe('vpn-verbindet-nicht')
  })

  it('spells out German umlauts and ß', () => {
    expect(slugify('Passwort zurücksetzen')).toBe('passwort-zuruecksetzen')
    expect(slugify('Größe ÄÖÜ ß')).toBe('groesse-aeoeue-ss')
  })

  it('strips other accents', () => {
    expect(slugify('Café déjà vu')).toBe('cafe-deja-vu')
  })

  it('collapses punctuation and trims dashes', () => {
    expect(slugify("Passwort zurücksetzen – so geht's!")).toBe('passwort-zuruecksetzen-so-geht-s')
    expect(slugify('  --Hallo   Welt--  ')).toBe('hallo-welt')
  })

  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })

  it('limits the length and never ends with a dash', () => {
    expect(slugify('a'.repeat(120))).toHaveLength(80)
    const slug = slugify('wort '.repeat(30))
    expect(slug.length).toBeLessThanOrEqual(80)
    expect(slug.endsWith('-')).toBe(false)
  })
})
