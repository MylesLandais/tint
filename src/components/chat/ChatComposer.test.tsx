import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatComposer } from './ChatComposer'

describe('ChatComposer', () => {
  it('reports a trimmed submit payload and supports IME-safe keyboard input', () => {
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()

    render(
      <ChatComposer
        value="  Hello Tint  "
        onValueChange={onValueChange}
        onSubmit={onSubmit}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, {
      key: 'Enter',
      keyCode: 229,
      isComposing: true,
    })
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'Hello Tint',
      attachments: [],
    })
  })

  it('shows stop mode and reports attachment intent', () => {
    const onStop = vi.fn()
    const onAttachmentAdd = vi.fn()
    const onAttachmentRemove = vi.fn()
    const file = new File(['mock'], 'notes.txt', { type: 'text/plain' })

    const { container } = render(
      <ChatComposer
        value=""
        state="streaming"
        attachments={[
          {
            id: 'attachment-1',
            name: 'existing.md',
            mediaType: 'text/markdown',
            status: 'ready',
          },
        ]}
        onValueChange={() => undefined}
        onSubmit={() => undefined}
        onStop={onStop}
        onAttachmentAdd={onAttachmentAdd}
        onAttachmentRemove={onAttachmentRemove}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Stop response' }))
    expect(onStop).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Remove existing.md' }))
    expect(onAttachmentRemove).toHaveBeenCalledWith('attachment-1')

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(onAttachmentAdd).toHaveBeenCalledWith([file])
  })
})
