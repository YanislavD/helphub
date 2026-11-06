import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserPrompt, parseDraft } from './draft'

const slugs = ['hardware', 'email-teams']

const valid = {
  title: 'Dienst-SIM: Fehler durch zweite SIM-Karte beheben',
  summary: 'Das Diensthandy zeigt einen Fehler? Entferne die private SIM-Karte.',
  category_slug: 'hardware',
  tags: ['SIM-Karte', 'Diensthandy'],
  content:
    '## So behebst du das Problem\n\n1. Entferne die **private SIM-Karte**.\n2. Starte das Telefon neu.',
}

describe('parseDraft', () => {
  it('accepts a complete answer', () => {
    const draft = parseDraft(JSON.stringify(valid), slugs)
    expect(draft).toMatchObject({ title: valid.title, category_slug: 'hardware', tags: valid.tags })
  })

  it('understands answers wrapped in a ```json fence', () => {
    const draft = parseDraft('```json\n' + JSON.stringify(valid) + '\n```', slugs)
    expect(draft?.title).toBe(valid.title)
  })

  it('returns null for text that is not JSON', () => {
    expect(parseDraft('Hier ist dein Artikel: ...', slugs)).toBeNull()
  })

  it('returns null when title or content are missing or too short', () => {
    expect(parseDraft(JSON.stringify({ ...valid, title: '' }), slugs)).toBeNull()
    expect(parseDraft(JSON.stringify({ ...valid, content: 'zu kurz' }), slugs)).toBeNull()
    expect(parseDraft(JSON.stringify({ summary: 'x' }), slugs)).toBeNull()
  })

  it('drops a category the model invented', () => {
    const draft = parseDraft(
      JSON.stringify({ ...valid, category_slug: 'erfundene-kategorie' }),
      slugs,
    )
    expect(draft?.category_slug).toBeNull()
  })

  it('cleans tags: trims, removes duplicates and non-strings, limits the count', () => {
    const tags = [' VPN ', 'VPN', 42, '', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
    const draft = parseDraft(JSON.stringify({ ...valid, tags }), slugs)
    expect(draft?.tags[0]).toBe('VPN')
    expect(draft?.tags.filter((t) => t === 'VPN')).toHaveLength(1)
    expect(draft?.tags.length).toBeLessThanOrEqual(8)
    expect(draft?.tags.every((t) => typeof t === 'string' && t.length > 0)).toBe(true)
  })

  it('removes a leading H1 because the title is stored separately', () => {
    const content = '# Doppelter Titel\n\n' + valid.content
    expect(
      parseDraft(JSON.stringify({ ...valid, content }), slugs)?.content.startsWith('## So behebst'),
    ).toBe(true)
  })

  it('survives a missing summary and tags', () => {
    const { summary: _s, tags: _t, ...rest } = valid
    const draft = parseDraft(JSON.stringify(rest), slugs)
    expect(draft).toMatchObject({ summary: '', tags: [] })
  })
})

describe('review notes', () => {
  it('keeps the open questions of the model, cleaned', () => {
    const draft = parseDraft(
      JSON.stringify({
        ...valid,
        review_notes: [
          ' Welche Modelle sind betroffen? ',
          '',
          42,
          'Welche Modelle sind betroffen?',
        ],
      }),
      slugs,
    )
    expect(draft?.review_notes).toEqual(['Welche Modelle sind betroffen?'])
  })

  it('defaults to an empty list', () => {
    expect(parseDraft(JSON.stringify(valid), slugs)?.review_notes).toEqual([])
  })
})

describe('prompts', () => {
  it('makes the description the only source of facts', () => {
    const prompt = buildSystemPrompt([])
    expect(prompt).toContain('EINZIGE Quelle')
    expect(prompt).toContain('review_notes')
  })

  it('lists every allowed category in the system prompt', () => {
    const prompt = buildSystemPrompt([
      { slug: 'hardware', name: 'Hardware' },
      { slug: 'email-teams', name: 'E-Mail & Teams' },
    ])
    expect(prompt).toContain('- hardware (Hardware)')
    expect(prompt).toContain('- email-teams (E-Mail & Teams)')
  })

  it('marks the description as data and includes the optional hint', () => {
    const prompt = buildUserPrompt('  Entferne die SIM.  ', 'sim karte fehler')
    expect(prompt).toContain('sim karte fehler')
    expect(prompt).toContain('Vorrang')
    expect(prompt).toContain('"""\nEntferne die SIM.\n"""')
  })
})
