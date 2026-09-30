import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import CodeTabs from './CodeTabs.svelte'

const tabs = [
  { id: 'python', language: 'python', code: 'print("hi")' },
  { id: 'rust', language: 'rust', code: 'fn main() {}' },
]

describe('Svelte CodeTabs', () => {
  it('moves focus and selection with keyboard navigation', async () => {
    const onValueChange = vi.fn()
    render(CodeTabs, { tabs, onValueChange })
    const python = screen.getByRole('tab', { name: 'Python' })
    const rust = screen.getByRole('tab', { name: 'Rust' })
    expect(python).toHaveAttribute('aria-selected', 'true')
    expect(document.getElementById(python.getAttribute('aria-controls')!)).toBeInTheDocument()
    expect(document.getElementById(rust.getAttribute('aria-controls')!)).toHaveAttribute('hidden')
    await fireEvent.keyDown(python, { key: 'ArrowRight' })
    expect(rust).toHaveFocus()
    expect(rust).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('fn main() {}')
    expect(onValueChange).toHaveBeenCalledWith('rust')
  })

  it('waits for a successful clipboard write before reporting copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(CodeTabs, { tabs })
    await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(writeText).toHaveBeenCalledWith('print("hi")')
    expect(screen.getByRole('button', { name: 'Code copied' })).toBeInTheDocument()
  })
})
