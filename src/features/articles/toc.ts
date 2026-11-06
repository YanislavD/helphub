import GithubSlugger from 'github-slugger'

export interface TocItem {
  id: string
  text: string
}

/**
 * Builds the "On this page" list from the level-2 headings of a Markdown text.
 * Uses the same slugger as `rehype-slug`, so the ids match the anchors in the rendered article.
 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  // Ignore "headings" inside fenced code blocks (e.g. shell comments starting with #).
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '')

  const items: TocItem[] = []
  for (const line of withoutCode.split('\n')) {
    const match = /^##\s+(.+?)\s*#*\s*$/.exec(line)
    if (match) {
      const text = match[1].replace(/[*_`[\]]/g, '')
      items.push({ id: slugger.slug(text), text })
    }
  }
  return items
}
