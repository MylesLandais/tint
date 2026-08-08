import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessage } from './ChatMessage'
import type { ChatMessageData, ChatMessagePart } from './types'

const RLO = '\u202E' // right-to-left override

const actor = { id: 'assistant', name: 'Assistant', kind: 'assistant' } as const

function messageWith(parts: readonly ChatMessagePart[]): ChatMessageData {
  return {
    id: 'message-1',
    actor,
    createdAt: '2026-08-02T15:00:00Z',
    status: 'complete',
    parts,
  }
}

describe('runtime tolerance of out-of-contract data', () => {
  it('renders an unrecognized tool status instead of taking the transcript down', () => {
    // `ChatToolStatus` is compile-time only; this arrives from a server.
    const rogue = { type: 'tool', id: 'tool-1', tool: { id: 't', name: 'search', status: 'throttled' } }

    render(<ChatMessage message={messageWith([rogue as unknown as ChatMessagePart])} />)

    expect(screen.getByText('search')).toBeInTheDocument()
    expect(screen.getByText('Throttled')).toBeInTheDocument()
  })

  it('surfaces an unknown part type rather than dropping it silently', () => {
    const rogue = { type: 'video', id: 'part-1', src: 'clip.mp4' }

    render(<ChatMessage message={messageWith([rogue as unknown as ChatMessagePart])} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot display/i)
  })

  it('contains a crashing built-in renderer to its own part', () => {
    const onRenderError = vi.fn()
    // `sources` is not an array, so the built-in renderer throws on `.map`.
    const broken = { type: 'sources', id: 'sources-1', sources: null }

    render(
      <ChatMessage
        message={messageWith([
          { id: 'text-1', type: 'text', text: 'Surviving sibling.' },
          broken as unknown as ChatMessagePart,
        ])}
        onRenderError={onRenderError}
      />,
    )

    expect(screen.getByText('Surviving sibling.')).toBeInTheDocument()
    expect(
      screen.getByText('This message part could not be displayed.'),
    ).toBeInTheDocument()
    expect(onRenderError).toHaveBeenCalled()
  })
})

describe('output caps and formatting', () => {
  it('truncates a tool payload too large to put in the DOM whole', () => {
    const bulky = { rows: Array.from({ length: 4000 }, (_, i) => `row-${i}`) }

    render(
      <ChatMessage
        message={messageWith([
          {
            id: 'tool-1',
            type: 'tool',
            tool: { id: 't', name: 'query', status: 'succeeded', output: bulky },
          },
        ])}
      />,
    )

    expect(screen.getByText(/Showing the first .* characters\./)).toBeInTheDocument()
  })

  it('formats audio duration as minutes and seconds', () => {
    render(
      <ChatMessage
        message={messageWith([
          { id: 'audio-1', type: 'audio', src: 'reply.mp3', duration: 187 },
        ])}
      />,
    )

    expect(screen.getByText('-3:07')).toBeInTheDocument()
  })

  it('strips bidi overrides from a filename and its remove label', () => {
    render(
      <ChatMessage
        message={messageWith([
          {
            id: 'file-1',
            type: 'file',
            attachment: {
              id: 'a1',
              name: `invoice${RLO}gnp.exe`,
              mediaType: 'application/octet-stream',
              status: 'ready',
            },
          },
        ])}
      />,
    )

    const name = screen.getByText('invoicegnp.exe')
    expect(name).toBeInTheDocument()
    expect(name.textContent).not.toContain(RLO)
  })
})
