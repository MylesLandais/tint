import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatMessageList } from './ChatMessageList'
import type { ChatMessageData } from './types'

const actor = { id: 'assistant', name: 'Assistant', kind: 'assistant' } as const

function message(id: string): ChatMessageData {
  return {
    id,
    actor,
    createdAt: '2026-08-02T15:00:00Z',
    status: 'complete',
    parts: [{ id: `${id}-text`, type: 'text', text: id }],
  }
}

describe('ChatMessageList', () => {
  it('provides roving transcript keyboard navigation', () => {
    const { container } = render(
      <ChatMessageList messages={[message('one'), message('two')]} />,
    )
    const items = container.querySelectorAll<HTMLElement>('[data-chat-message]')

    expect(items[1]).toHaveAttribute('tabindex', '0')
    items[1]!.focus()
    fireEvent.keyDown(items[1]!, { key: 'ArrowUp' })

    expect(items[0]).toHaveFocus()
    expect(items[0]).toHaveAttribute('tabindex', '0')
  })

  it('preserves the viewport when earlier messages are prepended', () => {
    const { container, rerender } = render(
      <ChatMessageList messages={[message('two'), message('three')]} />,
    )
    const viewport = container.querySelector<HTMLElement>(
      '[data-chat-message-list]',
    )!
    let height = 400
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => height,
    })
    viewport.scrollTop = 120
    fireEvent.scroll(viewport)

    height = 580
    rerender(
      <ChatMessageList
        messages={[message('one'), message('two'), message('three')]}
      />,
    )

    expect(viewport.scrollTop).toBe(300)
  })

  it('reports follow-state changes when the reader scrolls away', () => {
    const onFollowOutputChange = vi.fn()
    const { container } = render(
      <ChatMessageList
        messages={[message('one')]}
        onFollowOutputChange={onFollowOutputChange}
      />,
    )
    const viewport = container.querySelector<HTMLElement>(
      '[data-chat-message-list]',
    )!
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 300 },
    })
    viewport.scrollTop = 100
    fireEvent.scroll(viewport)

    expect(onFollowOutputChange).toHaveBeenCalledWith(false)
  })

  it('keeps a single playback slot so Repeat interrupts the other speaker', () => {
    const maya = { id: 'maya', name: 'Maya', kind: 'assistant' } as const
    const jordan = { id: 'jordan', name: 'Jordan', kind: 'assistant' } as const
    const messages: ChatMessageData[] = [
      {
        id: 'jordan-1',
        actor: jordan,
        createdAt: '2026-08-02T15:00:00Z',
        status: 'complete',
        parts: [{ id: 'jordan-text', type: 'text', text: 'Hello from Jordan.' }],
      },
      {
        id: 'maya-1',
        actor: maya,
        createdAt: '2026-08-02T15:00:02Z',
        status: 'complete',
        parts: [{ id: 'maya-text', type: 'text', text: 'Hello from Maya.' }],
      },
    ]

    const { container } = render(
      <ChatMessageList messages={messages} enableSpeak />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play Jordan' }))
    expect(
      container.querySelector('[data-message-id="jordan-1"]'),
    ).toHaveAttribute('data-speaking')
    expect(
      container.querySelector('[data-message-id="maya-1"]'),
    ).not.toHaveAttribute('data-speaking')

    fireEvent.click(screen.getByRole('button', { name: 'Play Maya' }))
    expect(
      container.querySelector('[data-message-id="maya-1"]'),
    ).toHaveAttribute('data-speaking')
    expect(
      container.querySelector('[data-message-id="jordan-1"]'),
    ).not.toHaveAttribute('data-speaking')
    expect(screen.getByRole('button', { name: 'Replay Maya' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('honors a controlled speakingMessageId', () => {
    const onSpeakingMessageIdChange = vi.fn()
    const messages = [message('one'), message('two')]

    const { rerender, container } = render(
      <ChatMessageList
        messages={messages}
        enableSpeak
        speakingMessageId="one"
        onSpeakingMessageIdChange={onSpeakingMessageIdChange}
      />,
    )

    expect(container.querySelector('[data-message-id="one"]')).toHaveAttribute(
      'data-speaking',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play Assistant' }))
    expect(onSpeakingMessageIdChange).toHaveBeenCalledWith('two')

    rerender(
      <ChatMessageList
        messages={messages}
        enableSpeak
        speakingMessageId="two"
        onSpeakingMessageIdChange={onSpeakingMessageIdChange}
      />,
    )
    expect(container.querySelector('[data-message-id="two"]')).toHaveAttribute(
      'data-speaking',
    )
    expect(
      container.querySelector('[data-message-id="one"]'),
    ).not.toHaveAttribute('data-speaking')
  })

  it('restarts the same clip when Replay is pressed again', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    const messages: ChatMessageData[] = [
      {
        id: 'maya-1',
        actor: { id: 'maya', name: 'Maya', kind: 'assistant' },
        createdAt: '2026-08-02T15:00:00Z',
        status: 'complete',
        parts: [
          { id: 'maya-text', type: 'text', text: 'Hello from Maya.' },
          {
            id: 'maya-audio',
            type: 'audio',
            src: '/audio/maya.wav',
            artist: 'Maya',
            title: 'Maya',
          },
        ],
      },
    ]

    render(<ChatMessageList messages={messages} enableSpeak />)
    fireEvent.click(screen.getByRole('button', { name: 'Replay Maya' }))
    const afterFirst = play.mock.calls.length
    expect(afterFirst).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Replay Maya' }))
    expect(play.mock.calls.length).toBeGreaterThan(afterFirst)

    play.mockRestore()
  })
})
