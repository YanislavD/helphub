import { describe, expect, it } from 'vitest'
import { chunkArticle, markdownToPlainText } from './chunk'

describe('markdownToPlainText', () => {
  it('removes Markdown syntax but keeps the words', () => {
    const text = markdownToPlainText(
      '## Titel\n\n1. **Wichtig** klicken\n2. [Link](https://x.de) öffnen',
    )
    expect(text).toContain('Titel')
    expect(text).toContain('Wichtig klicken')
    expect(text).toContain('Link öffnen')
    expect(text).not.toMatch(/[#*[\]]|https/)
  })

  it('turns alert blocks into a German label', () => {
    expect(markdownToPlainText('> [!WARNING]\n> Nicht ausschalten.')).toBe(
      'Achtung:\nNicht ausschalten.',
    )
    expect(markdownToPlainText('> [!NOTE]\n> Info')).toContain('Hinweis:')
  })

  it('keeps the content of code blocks (commands are searchable) but drops the fences', () => {
    const text = markdownToPlainText('```\nipconfig /flushdns\n```')
    expect(text).toContain('ipconfig /flushdns')
    expect(text).not.toContain('```')
  })
})

describe('chunkArticle', () => {
  const article = {
    title: 'VPN verbindet nicht',
    summary: 'Fehler 809 beheben',
    tags: ['VPN', 'Homeoffice'],
    content: '## Schritte\n\n1. Neu starten\n2. Hotspot testen',
  }

  it('starts with a chunk about the article itself', () => {
    const [head] = chunkArticle(article)
    expect(head).toContain('VPN verbindet nicht')
    expect(head).toContain('Fehler 809 beheben')
    expect(head).toContain('Stichworte: VPN, Homeoffice')
  })

  it('prefixes every body chunk with the title so it keeps its context', () => {
    const chunks = chunkArticle(article)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks.slice(1))
      expect(chunk.startsWith('VPN verbindet nicht\n')).toBe(true)
  })

  it('splits long content into several chunks of limited size', () => {
    const paragraph = 'Wort '.repeat(60).trim() // ~300 characters
    const long = { ...article, content: Array.from({ length: 5 }, () => paragraph).join('\n\n') }
    const chunks = chunkArticle(long, 900)

    expect(chunks).toHaveLength(4) // head + [2 paragraphs] + [2] + [1]
    for (const chunk of chunks.slice(1)) {
      expect(chunk.length).toBeLessThanOrEqual(900 + article.title.length + 1)
    }
  })

  it('splits a single huge paragraph at sentence ends', () => {
    const sentence = 'Das ist ein ziemlich langer Satz mit etwas Inhalt. '
    const chunks = chunkArticle({ ...article, content: sentence.repeat(60) }, 400)
    expect(chunks.length).toBeGreaterThan(3)
    for (const chunk of chunks.slice(1))
      expect(chunk.length).toBeLessThanOrEqual(400 + article.title.length + 1)
  })

  it('works for an article without summary, tags or body', () => {
    expect(chunkArticle({ title: 'Nur Titel', summary: '', tags: [], content: '' })).toEqual([
      'Nur Titel',
    ])
  })
})
