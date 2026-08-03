import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatComposer } from './ChatComposer'
import { ChatConversation } from './ChatConversation'
import { ChatMessage } from './ChatMessage'
import { ChatMessageList } from './ChatMessageList'
import {
  ChatDateDivider,
  ChatEmptyState,
  ChatTypingIndicator,
} from './ChatPrimitives'
import type { ChatMessageData } from './types'

const assistant = { id: 'assistant', name: 'Assistant', kind: 'assistant' } as const
const human = { id: 'me', name: 'Myles', kind: 'human' } as const

function message(
  id: string,
  overrides: Partial<ChatMessageData> = {},
): ChatMessageData {
  return {
    id,
    actor: assistant,
    createdAt: '2026-08-02T15:00:00Z',
    status: 'complete',
    parts: [{ id: `${id}-text`, type: 'text', text: id }],
    ...overrides,
  }
}

describe('ChatComposer accessibility', () => {
  it('keeps focus in the textarea while submitting', () => {
    const { rerender } = render(
      <ChatComposer value="Hello" onValueChange={() => {}} onSubmit={() => {}} />,
    )
    const input = screen.getByRole('textbox')
    input.focus()
    expect(input).toHaveFocus()

    rerender(
      <ChatComposer
        value="Hello"
        state="submitting"
        onValueChange={() => {}}
        onSubmit={() => {}}
      />,
    )

    // `disabled` would have blurred it to <body>; read-only preserves focus.
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveAttribute('aria-disabled', 'true')
  })

  it('excludes in-flight and failed uploads from the submit payload', () => {
    const onSubmit = vi.fn()

    render(
      <ChatComposer
        value="See attached"
        attachments={[
          { id: 'ready', name: 'a.pdf', mediaType: 'application/pdf', status: 'ready' },
          {
            id: 'uploading',
            name: 'b.pdf',
            mediaType: 'application/pdf',
            status: 'uploading',
            uploadProgress: 40,
          },
          { id: 'failed', name: 'c.pdf', mediaType: 'application/pdf', status: 'error' },
        ]}
        onValueChange={() => {}}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: [expect.objectContaining({ id: 'ready' })] }),
    )
  })

  it('will not send when the only attachment is still uploading', () => {
    const onSubmit = vi.fn()

    render(
      <ChatComposer
        value=""
        attachments={[
          {
            id: 'uploading',
            name: 'b.pdf',
            mediaType: 'application/pdf',
            status: 'uploading',
          },
        ]}
        onValueChange={() => {}}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('forwards the composer metadata onto the submit payload', () => {
    const onSubmit = vi.fn()

    render(
      <ChatComposer
        value="hi"
        metadata={{ conversationId: 'c-1' }}
        onValueChange={() => {}}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    expect(onSubmit).toHaveBeenCalledWith({
      text: 'hi',
      attachments: [],
      metadata: { conversationId: 'c-1' },
    })
  })
})

describe('ChatMessage accessibility', () => {
  it('marks a streaming message busy and clears it when complete', () => {
    const { container, rerender } = render(
      <ChatMessage message={message('one', { status: 'streaming' })} />,
    )
    const article = container.querySelector('[data-chat-message]')!
    expect(article).toHaveAttribute('aria-busy', 'true')

    rerender(<ChatMessage message={message('one', { status: 'complete' })} />)
    expect(article).not.toHaveAttribute('aria-busy')
  })

  it('shows one retry control when a recoverable error part renders its own', () => {
    render(
      <ChatMessage
        message={message('one', {
          status: 'error',
          parts: [
            { id: 'e', type: 'error', message: 'Stream failed.', recoverable: true },
          ],
        })}
        onAction={() => {}}
      />,
    )

    expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(1)
  })
})

describe('message copy', () => {
  it('copies text and code but never reasoning', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)

    render(
      <ChatMessage
        message={message('one', {
          parts: [
            { id: 'r', type: 'reasoning', text: 'Internal chain of thought.' },
            { id: 't', type: 'text', text: 'The answer is 42.' },
            { id: 'c', type: 'code', code: 'print(42)' },
          ],
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    expect(writeText).toHaveBeenCalledWith('The answer is 42.\n\nprint(42)')
    expect(writeText.mock.calls[0]![0]).not.toContain('chain of thought')
  })

  it('does not claim success when the clipboard write is refused', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('Write permission denied'))

    render(<ChatMessage message={message('one')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))

    // Wait for the rejection to settle before asserting, otherwise this would
    // pass simply by running before the promise resolved either way.
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByRole('button', { name: 'Message copied' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument()
  })

  it('confirms the copy once the write actually resolves', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<ChatMessage message={message('one')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy message' }))

    expect(
      await screen.findByRole('button', { name: 'Message copied' }),
    ).toBeInTheDocument()
  })
})

describe('ChatMessageList accessibility', () => {
  it('does not announce the reader their own message', () => {
    const { container } = render(
      <ChatMessageList
        currentActorId="me"
        messages={[message('mine', { actor: human })]}
      />,
    )

    // Not `toHaveTextContent('')` — an empty string matches any content.
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  })

  it('announces the other participant finishing a turn', () => {
    const { container } = render(
      <ChatMessageList currentActorId="me" messages={[message('theirs')]} />,
    )

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'Assistant finished responding',
    )
  })

  it('leaves the log silent so streamed tokens are not read aloud', () => {
    const { container } = render(<ChatMessageList messages={[message('one')]} />)
    const log = container.querySelector('[data-chat-message-list]')!

    expect(log).toHaveAttribute('role', 'log')
    expect(log).toHaveAttribute('aria-live', 'off')
    // Inert while aria-live is off; its presence only misleads.
    expect(log).not.toHaveAttribute('aria-relevant')
  })

  it('moves the tab stop to a newly arrived message until the reader takes over', () => {
    const { container, rerender } = render(
      <ChatMessageList messages={[message('one'), message('two')]} />,
    )
    const items = () =>
      container.querySelectorAll<HTMLElement>('[data-chat-message]')
    expect(items()[1]).toHaveAttribute('tabindex', '0')

    rerender(
      <ChatMessageList messages={[message('one'), message('two'), message('three')]} />,
    )
    expect(items()[2]).toHaveAttribute('tabindex', '0')

    // Once the reader picks a message, new arrivals stop stealing the tab stop.
    // A genuine .focus() — the delegated handler listens via React's focusin.
    items()[0]!.focus()
    rerender(
      <ChatMessageList
        messages={[
          message('one'),
          message('two'),
          message('three'),
          message('four'),
        ]}
      />,
    )
    expect(items()[0]).toHaveAttribute('tabindex', '0')
  })
})

describe('primitives', () => {
  it('labels the conversation region and exposes its density', () => {
    render(<ChatConversation density="compact">body</ChatConversation>)
    const region = screen.getByRole('region', { name: 'Conversation' })

    expect(region).toHaveAttribute('data-density', 'compact')
  })

  it('renders the empty state, date divider, and typing indicator', () => {
    const { rerender } = render(<ChatEmptyState />)
    expect(screen.getByText('Start a conversation')).toBeInTheDocument()

    rerender(<ChatDateDivider>Yesterday</ChatDateDivider>)
    expect(screen.getByRole('separator')).toHaveTextContent('Yesterday')

    rerender(<ChatTypingIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent('Assistant is responding')
  })
})
