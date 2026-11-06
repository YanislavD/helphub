// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TagInput } from './TagInput'

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState(initial)
  return <TagInput label="Tags" tags={tags} onChange={setTags} />
}

describe('TagInput', () => {
  it('adds a tag with Enter and with a comma', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Tags')

    await user.type(input, 'VPN{Enter}')
    await user.type(input, 'Homeoffice,')

    expect(screen.getByText('VPN')).toBeInTheDocument()
    expect(screen.getByText('Homeoffice')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('ignores duplicates regardless of upper/lower case', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['VPN']} />)

    await user.type(screen.getByLabelText('Tags'), 'vpn{Enter}')

    expect(screen.getAllByText(/^vpn$/i)).toHaveLength(1)
  })

  it('removes a tag with its x button', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['VPN', 'Teams']} />)

    await user.click(screen.getByRole('button', { name: 'Tag „VPN“ entfernen' }))

    expect(screen.queryByText('VPN')).not.toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
  })

  it('removes the last tag with Backspace on an empty field', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['VPN', 'Teams']} />)

    await user.click(screen.getByLabelText('Tags'))
    await user.keyboard('{Backspace}')

    expect(screen.queryByText('Teams')).not.toBeInTheDocument()
    expect(screen.getByText('VPN')).toBeInTheDocument()
  })

  it('allows at most 10 tags', async () => {
    const user = userEvent.setup()
    const ten = Array.from({ length: 10 }, (_, i) => `tag${i}`)
    render(<Harness initial={ten} />)

    expect(screen.getByLabelText('Tags')).toBeDisabled()
    expect(screen.getAllByRole('button')).toHaveLength(10)
    void user
  })
})
