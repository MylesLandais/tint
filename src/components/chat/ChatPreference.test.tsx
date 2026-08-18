import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatPreference } from './ChatPreference'
import type { ChatPreferenceOption } from './types'

const options = [
  {
    id: 'option-a',
    label: 'Response 1',
    parts: [
      {
        id: 'option-a-text',
        type: 'text',
        format: 'markdown',
        text: 'Prefer the **timeout** approach.',
      },
      {
        id: 'option-a-code',
        type: 'code',
        language: 'ts',
        code: 'setTimeout(run, 300)',
      },
    ],
  },
  {
    id: 'option-b',
    label: 'Response 2',
    parts: [
      {
        id: 'option-b-text',
        type: 'text',
        text: 'Prefer a debounced callback.',
      },
      {
        id: 'option-b-code',
        type: 'code',
        language: 'ts',
        code: 'useDebouncedCallback(run, 300)',
      },
    ],
  },
] as const satisfies readonly [ChatPreferenceOption, ChatPreferenceOption]

describe('ChatPreference', () => {
  it('splits options into a responsive two-column grid and renders nested parts', () => {
    const { container } = render(<ChatPreference options={options} />)

    expect(screen.getByText('Which response do you prefer?')).toBeInTheDocument()
    expect(screen.getByText('Response 1')).toBeInTheDocument()
    expect(screen.getByText('Response 2')).toBeInTheDocument()
    expect(screen.getByText(/timeout/)).toBeInTheDocument()
    expect(screen.getByText('Prefer a debounced callback.')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-chat-part="code"]')).toHaveLength(2)
    expect(container.textContent).toContain('setTimeout(run, 300)')
    expect(container.textContent).toContain('useDebouncedCallback(run, 300)')

    const group = container.querySelector('[role="radiogroup"]')
    expect(group).toHaveClass('sm:grid-cols-2')
  })

  it('reports a selection and locks further picks once selected', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <ChatPreference options={options} status="pending" onSelect={onSelect} />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /Response 1/i }))
    expect(onSelect).toHaveBeenCalledWith('option-a')

    rerender(
      <ChatPreference
        options={options}
        status="selected"
        selectedOptionId="option-a"
        onSelect={onSelect}
      />,
    )

    onSelect.mockClear()
    fireEvent.click(screen.getByRole('radio', { name: /Response 2/i }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByText('Preference recorded')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Response 1/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('does not treat nested part controls as a preference pick', () => {
    const onSelect = vi.fn()
    render(<ChatPreference options={options} onSelect={onSelect} />)

    fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0]!)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('moves radio focus with arrow keys without treating it as a pick', () => {
    const onSelect = vi.fn()
    render(<ChatPreference options={options} onSelect={onSelect} />)

    const first = screen.getByRole('radio', { name: /Response 1/i })
    const second = screen.getByRole('radio', { name: /Response 2/i })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })

    expect(second).toHaveFocus()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
