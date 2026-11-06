// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownContent } from './MarkdownContent'

describe('MarkdownContent', () => {
  it('renders headings with ids (for the "on this page" links)', () => {
    const { container } = render(<MarkdownContent>{'## Erste Schritte\n\nText'}</MarkdownContent>)
    const heading = container.querySelector('h2')
    expect(heading).toHaveTextContent('Erste Schritte')
    expect(heading).toHaveAttribute('id', 'erste-schritte')
  })

  it('renders numbered steps as an ordered list', () => {
    const { container } = render(<MarkdownContent>{'1. Neu starten\n2. Testen'}</MarkdownContent>)
    expect(container.querySelectorAll('ol > li')).toHaveLength(2)
  })

  it('turns > [!NOTE] and > [!WARNING] into callout boxes', () => {
    const { container } = render(
      <MarkdownContent>{'> [!NOTE]\n> Info\n\n> [!WARNING]\n> Achtung'}</MarkdownContent>,
    )
    expect(container.querySelector('.markdown-alert-note')).toHaveTextContent('Info')
    expect(container.querySelector('.markdown-alert-warning')).toHaveTextContent('Achtung')
  })

  it('renders GitHub-style tables and code blocks', () => {
    const { container } = render(
      <MarkdownContent>
        {'| A | B |\n|---|---|\n| 1 | 2 |\n\n```\nipconfig /flushdns\n```'}
      </MarkdownContent>,
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('pre code')).toHaveTextContent('ipconfig /flushdns')
  })

  it('does NOT render raw HTML, so an article cannot inject scripts (XSS)', () => {
    const { container } = render(
      <MarkdownContent>
        {
          'Hallo <script>alert(1)</script> <img src=x onerror="alert(2)"> <iframe src="https://evil.example"></iframe>'
        }
      </MarkdownContent>,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
  })
})
