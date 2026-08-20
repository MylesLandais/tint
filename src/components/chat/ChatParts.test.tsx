import { fireEvent, render, screen } from '@testing-library/react'
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

describe('image gallery parts', () => {
  it('renders a four-image grid with caption and opens the lightbox', () => {
    const onAction = vi.fn()
    render(
      <ChatMessage
        message={messageWith([
          {
            id: 'gallery-1',
            type: 'images',
            caption: 'vibrant California poppies',
            images: [
              { id: 'a', src: '/images/gallery-1.svg', alt: 'Variation 1' },
              { id: 'b', src: '/images/gallery-2.svg', alt: 'Variation 2' },
              { id: 'c', src: '/images/gallery-3.svg', alt: 'Variation 3' },
              { id: 'd', src: '/images/gallery-4.svg', alt: 'Variation 4' },
            ],
          },
        ])}
        onAction={onAction}
      />,
    )

    const gallery = document.querySelector('[data-chat-part="images"]')
    expect(gallery).toHaveAttribute('data-count', '4')
    expect(screen.getByText('vibrant California poppies')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open image 2: variation 2/i }))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'message-1',
        action: 'image-open',
        partId: 'gallery-1',
        imageId: 'b',
        imageIndex: 1,
      }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByAltText('Variation 2').length).toBeGreaterThan(0)
  })

  it('emits image-action when a gallery action button is pressed', () => {
    const onAction = vi.fn()
    render(
      <ChatMessage
        message={messageWith([
          {
            id: 'gallery-1',
            type: 'images',
            images: [
              { id: 'a', src: '/images/gallery-1.svg', alt: 'One' },
              { id: 'b', src: '/images/gallery-2.svg', alt: 'Two' },
            ],
            actions: [
              { id: 'upscale-1', label: 'U1', imageId: 'a' },
              { id: 'vary-2', label: 'V2', imageId: 'b' },
            ],
          },
        ])}
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'U1' }))
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'image-action',
        actionId: 'upscale-1',
        imageId: 'a',
        partId: 'gallery-1',
      }),
    )
  })

  it('shows a thumbnail for image file attachments with previewUrl', () => {
    render(
      <ChatMessage
        message={messageWith([
          {
            id: 'file-1',
            type: 'file',
            attachment: {
              id: 'a1',
              name: 'poppy.png',
              mediaType: 'image/png',
              status: 'ready',
              previewUrl: '/images/gallery-1.svg',
            },
          },
        ])}
      />,
    )

    const thumb = document.querySelector('[data-chat-part="file"] img')
    expect(thumb).toHaveAttribute('src', '/images/gallery-1.svg')
  })
})
