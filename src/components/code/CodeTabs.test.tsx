import { fireEvent, render, screen } from '@testing-library/react'
import { FileCode2 } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { CodeTabs } from './CodeTabs'

const tabs = [
  { id: 'python', language: 'python', code: 'print("hi")' },
  { id: 'rust', language: 'rust', code: 'fn main() {}' },
] as const

describe('CodeTabs', () => {
  it('renders an accessible tabset and changes panels with keyboard navigation', () => {
    render(<CodeTabs tabs={tabs} renderAccessory={(tab) => <aside>{`install-${tab.id}`}</aside>} />)

    const python = screen.getByRole('tab', { name: 'Python' })
    const rust = screen.getByRole('tab', { name: 'Rust' })
    expect(python).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('print("hi")')

    fireEvent.keyDown(python, { key: 'ArrowRight' })
    expect(rust).toHaveFocus()
    expect(rust).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('fn main() {}')
    expect(screen.getByText('install-rust')).toBeInTheDocument()
  })

  it('supports generic tab labels and optional icons independently of language', () => {
    render(
      <CodeTabs
        tabs={[{ id: 'preview', label: 'Preview', icon: FileCode2, language: 'plaintext', code: 'hello' }]}
      />,
    )

    expect(screen.getByRole('tab', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('hello')
  })
})
