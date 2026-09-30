import { render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScrollingLabel from './ScrollingLabel.svelte'

function stubWidths(container: number, content: number) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-scrolling-label') ? container : 0
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-scrolling-label-content') ? content : 0
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ScrollingLabel', () => {
  it('keeps full text available and does not scroll when it fits', () => {
    stubWidths(200, 120)
    render(ScrollingLabel, { text: 'Short title' })
    expect(screen.getByText('Short title').closest('[data-scrolling-label]')).toHaveAttribute('title', 'Short title')
    expect(screen.getByText('Short title').closest('[data-scrolling-label]')).not.toHaveAttribute('data-overflowing')
  })

  it('sets the measured animation distance only on overflow', async () => {
    stubWidths(100, 260)
    render(ScrollingLabel, { text: 'A long title' })
    await vi.waitFor(() => expect(screen.getByText('A long title').closest('[data-scrolling-label]')).toHaveAttribute('data-overflowing', ''))
    expect(screen.getByText('A long title').style.getPropertyValue('--tint-scrolling-label-distance')).toBe('160px')
  })

  it('re-measures on resize and remounts animated content on text change', async () => {
    let containerWidth = 100
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute('data-scrolling-label') ? containerWidth : 0
    })
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute('data-scrolling-label-content') ? 260 : 0
    })
    let notifyResize: (() => void) | undefined
    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = () => callback([], this as unknown as ResizeObserver)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)

    const view = render(ScrollingLabel, { text: 'First title' })
    const first = screen.getByText('First title')
    await vi.waitFor(() => expect(first.closest('[data-scrolling-label]')).toHaveAttribute('data-overflowing', ''))

    await view.rerender({ text: 'Second title' })
    const second = screen.getByText('Second title')
    expect(second).not.toBe(first)
    await vi.waitFor(() => expect(second.style.getPropertyValue('--tint-scrolling-label-distance')).toBe('160px'))

    containerWidth = 300
    notifyResize?.()
    await vi.waitFor(() => expect(second.closest('[data-scrolling-label]')).not.toHaveAttribute('data-overflowing'))
  })
})
