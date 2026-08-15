import { fireEvent, render } from '@testing-library/react'
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

  it('resolves parentMessageId into a quoted-reply header', () => {
    const { container } = render(
      <ChatMessageList
        messages={[
          message('one'),
          { ...message('two'), parentMessageId: 'one' },
        ]}
      />,
    )

    const contexts = container.querySelectorAll('[data-chat-reply-context]')
    expect(contexts).toHaveLength(1)
    expect(contexts[0]).toHaveTextContent('one')
  })
})
