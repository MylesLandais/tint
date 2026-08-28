import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollingLabel } from './ScrollingLabel'

/**
 * jsdom does no layout, so every width reads zero. These stubs size the two
 * boxes the component measures: the outer container (clientWidth) and the
 * inline-block content (offsetWidth).
 */
function stubWidths({ container, content }: { container: number; content: number }) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.hasAttribute('data-scrolling-label') ? container : 0
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.hasAttribute('data-scrolling-label-content') ? content : 0
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ScrollingLabel', () => {
  it('renders the full text with a title tooltip', () => {
    render(<ScrollingLabel text="Everything Is Borrowed" />)
    const label = screen.getByText('Everything Is Borrowed').closest('[data-scrolling-label]')
    expect(label).toHaveAttribute('title', 'Everything Is Borrowed')
  })

  it('lets the host override the tooltip', () => {
    render(<ScrollingLabel text="track" title="Track title" />)
    expect(screen.getByText('track').closest('[data-scrolling-label]')).toHaveAttribute(
      'title',
      'Track title',
    )
  })

  it('does not marquee when the text fits', () => {
    stubWidths({ container: 200, content: 120 })
    render(<ScrollingLabel text="Fits" />)
    const label = screen.getByText('Fits').closest('[data-scrolling-label]')
    expect(label).not.toHaveAttribute('data-overflowing')
    expect(screen.getByText('Fits')).not.toHaveAttribute('style')
  })

  it('measures the overflow and drives the animation from the distance', () => {
    stubWidths({ container: 100, content: 260 })
    render(<ScrollingLabel text="A title far too long for the box it lives in" />)
    const label = screen
      .getByText('A title far too long for the box it lives in')
      .closest('[data-scrolling-label]')
    expect(label).toHaveAttribute('data-overflowing', '')
    const content = screen.getByText('A title far too long for the box it lives in')
    expect(content.style.getPropertyValue('--tint-scrolling-label-distance')).toBe('160px')
    expect(content.style.getPropertyValue('--tint-scrolling-label-duration')).not.toBe('')
  })

  it('re-measures and remounts the content when the text changes', () => {
    stubWidths({ container: 100, content: 260 })
    const { rerender } = render(<ScrollingLabel text="first title" />)
    const before = screen.getByText('first title')
    expect(before.closest('[data-scrolling-label]')).toHaveAttribute('data-overflowing', '')

    // The key on the content span remounts the animated node, resetting the
    // offset to zero (and restarting the delay) instead of mid-scroll text swap.
    rerender(<ScrollingLabel text="second" />)
    const after = screen.getByText('second')
    expect(after).not.toBe(before)
  })

  it('re-measures when the container resizes', () => {
    let onResize: (() => void) | undefined
    class CaptureResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        onResize = () => callback([], this as unknown as ResizeObserver)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', CaptureResizeObserver)
    stubWidths({ container: 100, content: 260 })
    render(<ScrollingLabel text="long" />)
    expect(screen.getByText('long').closest('[data-scrolling-label]')).toHaveAttribute(
      'data-overflowing',
      '',
    )

    stubWidths({ container: 300, content: 260 })
    act(() => onResize?.())
    expect(screen.getByText('long').closest('[data-scrolling-label]')).not.toHaveAttribute(
      'data-overflowing',
    )
  })
})
