// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ArticleCard } from './ArticleCard'

const article = {
  id: 'a1',
  title: 'Drucker druckt nicht',
  slug: 'drucker-druckt-nicht',
  summary: 'Der Druckauftrag hängt in der Warteschlange.',
  updated_at: '2026-11-06T12:00:00Z',
  category: { name: 'Drucker' },
}

function renderCard(props: Partial<Parameters<typeof ArticleCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ArticleCard article={article} {...props} />
    </MemoryRouter>,
  )
}

describe('ArticleCard', () => {
  it('links to the article page and shows title, summary and category', () => {
    renderCard()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/articles/drucker-druckt-nicht')
    expect(screen.getByText('Drucker druckt nicht')).toBeInTheDocument()
    expect(screen.getByText('Der Druckauftrag hängt in der Warteschlange.')).toBeInTheDocument()
    expect(screen.getByText('Drucker')).toBeInTheDocument()
  })

  it('shows the update date when it is not a search result', () => {
    renderCard()
    expect(screen.getByText('Aktualisiert am 06.11.2026')).toBeInTheDocument()
  })

  it('shows the relevance level and the "best match" badge for search results', () => {
    renderCard({ tier: 'high', best: true })
    expect(screen.getByText('Sehr relevant')).toBeInTheDocument()
    expect(screen.getByText('Beste Übereinstimmung')).toBeInTheDocument()
    expect(screen.queryByText(/Aktualisiert am/)).not.toBeInTheDocument()
  })

  it('shows a weaker level without the best-match badge', () => {
    renderCard({ tier: 'low' })
    expect(screen.getByText('Möglicherweise relevant')).toBeInTheDocument()
    expect(screen.queryByText('Beste Übereinstimmung')).not.toBeInTheDocument()
  })

  it('reports clicks (used to log which result was opened)', async () => {
    const onOpen = vi.fn()
    renderCard({ onOpen })
    await userEvent.setup().click(screen.getByRole('link'))
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
