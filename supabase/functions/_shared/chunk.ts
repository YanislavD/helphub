// Pure TypeScript (no Deno APIs) so it can also be unit-tested with Vitest.

export interface ChunkableArticle {
  title: string
  summary: string
  tags: string[]
  content: string
}

const GERMAN_ALERT_TITLES: Record<string, string> = {
  NOTE: 'Hinweis',
  TIP: 'Tipp',
  IMPORTANT: 'Wichtig',
  WARNING: 'Achtung',
  CAUTION: 'Vorsicht',
}

/** Removes Markdown syntax that carries no meaning for a text-embedding model. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(
      /^>\s*\[!(\w+)\]\s*$/gm,
      (_m, type: string) => `${GERMAN_ALERT_TITLES[type.toUpperCase()] ?? 'Hinweis'}:`,
    )
    .replace(/^```.*$/gm, '') // fence lines (keep the code itself, commands are searchable)
    .replace(/^>\s?/gm, '') // blockquote markers
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '') // list markers
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → link text
    .replace(/[*_`]+/g, '') // bold / italic / inline code markers
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Splits an overlong paragraph at sentence ends. */
function splitLongBlock(block: string, maxChars: number): string[] {
  if (block.length <= maxChars) return [block]
  const sentences = block.split(/(?<=[.!?])\s+/)
  const parts: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && (current + ' ' + sentence).length > maxChars) {
      parts.push(current)
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }
  if (current) parts.push(current)
  // A single sentence without punctuation could still be too long: hard-cut it.
  return parts.flatMap((p) =>
    p.length > maxChars ? (p.match(new RegExp(`.{1,${maxChars}}`, 'gs')) ?? [p]) : [p],
  )
}

/**
 * Turns an article into chunks for embedding.
 *  - chunk 0: title + summary + tags (what the article is about, in a nutshell)
 *  - following chunks: the body, grouped paragraph by paragraph up to `maxChars`
 * Every body chunk starts with the title so that a chunk like "Starte den PC neu." keeps its context.
 */
export function chunkArticle(article: ChunkableArticle, maxChars = 900): string[] {
  const head = [
    article.title,
    article.summary,
    article.tags.length ? `Stichworte: ${article.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const chunks = [head]

  const blocks = markdownToPlainText(article.content)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .flatMap((b) => splitLongBlock(b, maxChars))

  let current = ''
  for (const block of blocks) {
    if (current && (current + '\n\n' + block).length > maxChars) {
      chunks.push(`${article.title}\n${current}`)
      current = block
    } else {
      current = current ? `${current}\n\n${block}` : block
    }
  }
  if (current) chunks.push(`${article.title}\n${current}`)

  return chunks
}
