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
})
