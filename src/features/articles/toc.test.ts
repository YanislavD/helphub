import { describe, expect, it } from 'vitest'
import { extractToc } from './toc'

describe('extractToc', () => {
  it('collects level-2 headings only', () => {
    const md = '# Titel\n\n## Erste Stufe\ntext\n### Unterpunkt\n## Zweite Stufe'
    expect(extractToc(md)).toEqual([
      { id: 'erste-stufe', text: 'Erste Stufe' },
      { id: 'zweite-stufe', text: 'Zweite Stufe' },
    ])
  })

  it('removes inline Markdown from the text', () => {
    expect(extractToc('## Der **fette** `Code`')).toEqual([
      { id: 'der-fette-code', text: 'Der fette Code' },
    ])
  })

  it('ignores "headings" inside fenced code blocks', () => {
    const md = '## Echt\n\n```\n## kein Heading\n```\n'
    expect(extractToc(md).map((t) => t.text)).toEqual(['Echt'])
  })

  it('gives duplicate headings unique ids, like the renderer does', () => {
    const items = extractToc('## Hilfe\n\n## Hilfe')
    expect(items.map((t) => t.id)).toEqual(['hilfe', 'hilfe-1'])
  })

  it('handles questions and German text', () => {
    expect(extractToc('## Warum passiert das?')[0].id).toBe('warum-passiert-das')
  })

  it('returns an empty list without headings', () => {
    expect(extractToc('Nur Text.')).toEqual([])
  })
})
