import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageAlternatives } from './ChatMessageAlternatives'
import { ChatMessageEditor } from './ChatMessageEditor'
import { ChatMessageList } from './ChatMessageList'

describe('message versions and editing', () => {
  it('uses stable IDs across missing source slots and respects boundaries', () => {
    const select = vi.fn()
    const props = { alternatives: [{ id: '0' }, { id: '2' }, { id: '3' }], value: '2', onValueChange: select }
    const { rerender } = render(<ChatMessageAlternatives {...props} />)
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3')
    fireEvent.click(screen.getByRole('button', { name: 'Previous saved response' }))
    expect(select).toHaveBeenCalledWith('0')
    fireEvent.click(screen.getByRole('button', { name: 'Next saved response' }))
    expect(select).toHaveBeenCalledWith('3')
    rerender(<ChatMessageAlternatives {...props} value="0" />)
    expect(screen.getByRole('button', { name: 'Previous saved response' })).toBeDisabled()
    rerender(<ChatMessageAlternatives {...props} disabled />)
    expect(screen.getByRole('button', { name: 'Next saved response' })).toBeDisabled()
  })

  it('requests another response only when the host supplies an action', () => {
    const generate = vi.fn()
    const { rerender } = render(<ChatMessageAlternatives alternatives={[{ id: 'original' }]} value="original"
      onValueChange={vi.fn()} onRegenerate={generate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate another response' }))
    expect(generate).toHaveBeenCalledOnce()
    rerender(<ChatMessageAlternatives alternatives={[]} value="" onValueChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Generate another response' })).toBeNull()
  })

  it('renders host editing controls through the list and preserves an error draft', () => {
    const save = vi.fn(), cancel = vi.fn(), change = vi.fn()
    render(<ChatMessageList messages={[{ id: 'one', actor: { id: 'a', name: 'Aster', kind: 'assistant' },
      createdAt: '2026-09-13T12:00:00Z', status: 'complete', parts: [{ id: 'text', type: 'text', text: 'Original' }] }]}
      renderMessageFooter={() => <ChatMessageEditor value="My draft" onValueChange={change}
        onSave={save} onCancel={cancel} error="The message changed" />} />)
    const input = screen.getByRole('textbox', { name: 'Edit message' })
    expect(input).toHaveValue('My draft')
    expect(input).toHaveAccessibleDescription('The message changed')
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
    expect(save).toHaveBeenCalledOnce()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(cancel).toHaveBeenCalledOnce()
  })
})
