import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessage } from './ChatMessage'
import type { ChatMessageData } from './types'

const actor = {
  id: 'assistant',
  name: 'Tint Assistant',
  kind: 'assistant',
} as const

describe('ChatMessage', () => {
  it('renders ordered rich parts, sanitizes links, and reports approval intent', () => {
    const onToolApproval = vi.fn()
    const message: ChatMessageData = {
      id: 'message-1',
      actor,
      createdAt: '2026-08-02T15:00:00Z',
      status: 'complete',
      parts: [
        {
          id: 'markdown',
          type: 'text',
          format: 'markdown',
          text: '[safe](https://example.com) and [unsafe](javascript:alert(1))',
        },
        {
          id: 'approval',
          type: 'approval',
          approval: {
            id: 'approval-request',
            title: 'Run local tool?',
            status: 'pending',
          },
        },
      ],
    }

    render(
      <ChatMessage message={message} onToolApproval={onToolApproval} />,
    )

    expect(screen.getByRole('link', { name: 'safe' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
    expect(screen.getByText('unsafe').closest('a')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onToolApproval).toHaveBeenCalledWith({
      messageId: 'message-1',
      partId: 'approval',
      approvalId: 'approval-request',
      approved: true,
      reason: undefined,
    })
  })

  it('isolates a failing custom renderer and reports retry', () => {
    const onAction = vi.fn()
    const message: ChatMessageData = {
      id: 'message-error',
      actor,
      createdAt: '2026-08-02T15:00:00Z',
      status: 'error',
      parts: [
        {
          id: 'recoverable-error',
          type: 'error',
          message: 'Mock stream failed.',
          recoverable: true,
        },
      ],
    }

    render(
      <ChatMessage
        message={message}
        onAction={onAction}
        renderPart={() => {
          throw new Error('Application renderer failed')
        }}
      />,
    )

    expect(
      screen.getByText('This message part could not be displayed.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onAction).toHaveBeenCalledWith({
      messageId: 'message-error',
      action: 'retry',
    })
  })

  it('hides Play until enableSpeak is on, then reports speak rather than retry', () => {
    const onAction = vi.fn()
    const message: ChatMessageData = {
      id: 'message-1',
      actor,
      createdAt: '2026-08-02T15:00:00Z',
      status: 'complete',
      parts: [{ id: 'text-1', type: 'text', text: 'Hello from Tint.' }],
    }

    const { rerender } = render(<ChatMessage message={message} onAction={onAction} />)
    expect(screen.queryByRole('button', { name: 'Play Tint Assistant' })).not.toBeInTheDocument()

    rerender(<ChatMessage message={message} onAction={onAction} enableSpeak />)
    fireEvent.click(screen.getByRole('button', { name: 'Play Tint Assistant' }))
    expect(onAction).toHaveBeenCalledWith({
      messageId: 'message-1',
      action: 'speak',
    })
    expect(screen.getByRole('button', { name: 'Replay Tint Assistant' })).toBeInTheDocument()
  })

  it('labels Replay when a ChatAudio part is already attached', () => {
    const message: ChatMessageData = {
      id: 'maya-1',
      actor: { id: 'maya', name: 'Maya', kind: 'assistant' },
      createdAt: '2026-08-02T15:00:00Z',
      status: 'complete',
      parts: [
        { id: 'text-1', type: 'text', text: 'I am Maya.' },
        {
          id: 'audio-1',
          type: 'audio',
          src: '/audio/maya.wav',
          artist: 'Maya',
          title: 'Maya',
        },
      ],
    }

    render(
      <ChatMessage message={message} enableSpeak speakingMessageId="maya-1" />,
    )

    const replay = screen.getByRole('button', { name: 'Replay Maya' })
    expect(replay).toHaveAttribute('aria-pressed', 'true')
    expect(replay).toHaveTextContent('Replay')
  })

  it('does not offer Play while the message is still streaming', () => {
    const message: ChatMessageData = {
      id: 'streaming-1',
      actor,
      createdAt: '2026-08-02T15:00:00Z',
      status: 'streaming',
      parts: [{ id: 'text-1', type: 'text', text: 'Hel', status: 'streaming' }],
    }

    render(<ChatMessage message={message} enableSpeak />)
    expect(screen.queryByRole('button', { name: /Play|Replay/ })).not.toBeInTheDocument()
  })

  it('renders a quoted-reply header and emits a reply action', () => {
    const onAction = vi.fn()
    const parent: ChatMessageData = {
      id: 'parent',
      actor: { id: 'human', name: 'Ada', kind: 'human' },
      createdAt: '2026-08-02T14:59:00Z',
      status: 'complete',
      parts: [{ id: 'parent-text', type: 'text', text: 'What is the thread model?' }],
    }
    const message: ChatMessageData = {
      id: 'reply',
      actor,
      createdAt: '2026-08-02T15:00:00Z',
      status: 'complete',
      parentMessageId: 'parent',
      parts: [{ id: 'reply-text', type: 'text', text: 'Flat list, derived tree.' }],
    }

    render(
      <ChatMessage message={message} replyToMessage={parent} onAction={onAction} />,
    )

    const context = document.querySelector('[data-chat-reply-context]')!
    expect(context).toHaveTextContent('Ada')
    expect(context).toHaveTextContent('What is the thread model?')

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(onAction).toHaveBeenCalledWith({ messageId: 'reply', action: 'reply' })  })
})
