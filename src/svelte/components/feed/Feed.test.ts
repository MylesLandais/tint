import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeedEntry, FeedLayoutVariant } from '../../../core/feed'
import FeedEntryCard from './FeedEntryCard.svelte'
import FeedFixture from './FeedFixture.svelte'
import FeedLayout from './FeedLayout.svelte'
import NarrationTransport from './NarrationTransport.svelte'
import ReaderFixture from './ReaderFixture.svelte'
import SelectionToolbar from './SelectionToolbar.svelte'
import SourceHealthBadge from './SourceHealthBadge.svelte'
import SplitFixture from './SplitFixture.svelte'
import ViewModeToggle from './ViewModeToggle.svelte'

const entries: FeedEntry[] = [
  { id: 'a', sourceId: 'source', title: 'Alpha', url: '#a', publishedAt: '2026-08-01T00:00:00Z', excerpt: 'One', tags: ['new'], readState: 'unread', contentKind: 'article', artifactStatus: 'ready' },
  { id: 'b', sourceId: 'source', title: 'Beta', url: '#b', publishedAt: '2026-08-02T00:00:00Z', excerpt: 'Two', tags: [], readState: 'read', contentKind: 'video' },
]

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Svelte feed presentation', () => {
  it('keeps selection controlled and lets nested action buttons act independently', async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    const view = render(FeedFixture, { entries, selectedId: 'a', onSelect, onAction })
    const card = screen.getByText('Alpha').closest('[data-tint-feed-entry]')!
    const select = screen.getByRole('button', { name: 'Alpha' })
    expect(card).toHaveAttribute('data-unread')
    expect(card).toHaveTextContent('Unread')
    expect(card).toHaveAttribute('data-selected')
    expect(select).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(screen.getByText('new')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Archive Alpha' }))
    expect(onAction).toHaveBeenCalledWith('a')
    expect(onSelect).not.toHaveBeenCalled()
    await fireEvent.click(card)
    await fireEvent.click(select)
    expect(onSelect.mock.calls).toEqual([['a'], ['a']])
    expect(select).toHaveAttribute('aria-pressed', 'true')
    await view.rerender({ entries, selectedId: 'b', onSelect, onAction })
    expect(select).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders every layout variant from the same entries and an empty state', async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    const view = render(FeedFixture, { entries, onSelect, onAction })
    const variants: FeedLayoutVariant[] = ['feed', 'list', 'magazine', 'wall', 'carousel', 'ticker']
    for (const variant of variants) {
      await view.rerender({ entries, variant, onSelect, onAction })
      expect(view.container.querySelector('[data-tint-feed-layout]')).toHaveAttribute('data-variant', variant)
      expect(view.container.querySelectorAll('[data-tint-feed-entry]')).toHaveLength(2)
      expect(screen.getByText('Alpha')).toBeInTheDocument()
      expect(screen.getByText('Beta')).toBeInTheDocument()
    }
    expect(view.container.querySelector('[data-tint-feed-layout][data-variant="ticker"]')).toBeInTheDocument()
    view.unmount()
    render(FeedLayout, { entries: [], empty: 'No saved articles.' })
    expect(screen.getByText('No saved articles.')).toBeInTheDocument()
  })

  it('renders a passive card without a tab stop', () => {
    render(FeedEntryCard, { entry: entries[0] })
    const card = screen.getByText('Alpha').closest('[data-tint-feed-entry]')!
    expect(card).not.toHaveAttribute('tabindex')
    expect(card).not.toHaveAttribute('role')
  })

  it('offers controlled view modes, source health, and positioned selection actions', async () => {
    const onChange = vi.fn()
    const toggle = render(ViewModeToggle, { value: 'feed', options: ['feed', 'list'], onChange })
    await fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(onChange).toHaveBeenCalledWith('list')
    expect(screen.getByRole('button', { name: 'Feed' })).toHaveAttribute('aria-pressed', 'true')
    await toggle.rerender({ value: 'list', options: ['feed', 'list'], onChange, disabled: true })
    expect(screen.getByRole('button', { name: 'List' })).toBeDisabled()
    toggle.unmount()

    render(SourceHealthBadge, { health: 'unreachable' })
    expect(screen.getByText('unreachable').closest('[data-badge]')).toHaveAttribute('data-tone', 'danger')
    const onAction = vi.fn()
    const actions = [{ id: 'quote', label: 'Quote' }, { id: 'copy', label: 'Copy' }]
    const bar = render(SelectionToolbar, { open: false, position: { x: 120, y: 80 }, actions, onAction })
    expect(screen.queryByRole('toolbar')).toBeNull()
    await bar.rerender({ open: true, position: { x: 120, y: 80 }, actions, onAction })
    expect(screen.getByRole('toolbar', { name: 'Selection actions' })).toHaveStyle({ left: '120px', top: '80px' })
    const quote = screen.getByRole('button', { name: 'Quote' })
    quote.focus()
    await fireEvent.keyDown(quote, { key: 'ArrowRight' })
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus()
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Copy' }), { key: 'Home' })
    expect(quote).toHaveFocus()
    await fireEvent.click(screen.getByRole('button', { name: 'Quote' }))
    expect(onAction).toHaveBeenCalledWith('quote')
  })

  it('keeps reader highlights separate from body content and reports a highlight click', async () => {
    const onHighlightClick = vi.fn()
    const { container } = render(ReaderFixture, { onHighlightClick })
    expect(container.querySelector('[data-tint-reader-header]')).toHaveTextContent('Reader header')
    expect(container.querySelector('[data-tint-reader-body]')).toHaveTextContent('abcdefghij')
    expect(container.querySelector('[data-tint-highlight-layer]')).not.toBe(container.querySelector('[data-tint-reader-body]'))
    const mark = container.querySelector('[data-tint-highlight="middle"]')!
    expect(mark).toHaveAttribute('data-active')
    await fireEvent.click(screen.getByRole('button', { name: 'Highlight: cde' }))
    expect(onHighlightClick).toHaveBeenCalledWith('middle')
  })

  it('reports pane resize intent and stacks by container width', async () => {
    let width = 1000
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { width: this.hasAttribute('data-tint-split-pane') ? width : this.hasAttribute('data-tint-split-pane-start') ? 250 : 300 } as DOMRect
    })
    const callbacks: ResizeObserverCallback[] = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { callbacks.push(callback) }
      observe() {}
      disconnect() {}
    })
    const onStartWidthChange = vi.fn()
    const onMiddleWidthChange = vi.fn()
    const view = render(SplitFixture, { three: true, onStartWidthChange, onMiddleWidthChange })
    const root = view.container.querySelector('[data-tint-split-pane]')!
    await waitFor(() => expect(root).toHaveAttribute('data-layout', 'columns'))
    const first = screen.getByRole('separator', { name: 'Resize start pane' })
    expect(first).toHaveAttribute('aria-valuenow', '250')
    await fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(onStartWidthChange).toHaveBeenCalledWith(258)
    await fireEvent.pointerDown(first, { clientX: 100 })
    await fireEvent.pointerMove(window, { clientX: 200 })
    await fireEvent.pointerUp(window)
    expect(onStartWidthChange).toHaveBeenCalledWith(350)
    width = 800
    callbacks[0]?.([], {} as ResizeObserver)
    await waitFor(() => expect(root).toHaveAttribute('data-layout', 'stacked'))
    expect(first).toHaveAttribute('tabindex', '-1')
  })

  it('resets narration on src change while exposing play, skip, progress, rate and ended intent', async () => {
    let paused = true
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      paused = true
      this.dispatchEvent(new Event('pause'))
    })
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      paused = false
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused)
    const onEnded = vi.fn()
    const view = render(NarrationTransport, { src: '/clip.mp3', label: 'Article', onEnded })
    const audio = view.container.querySelector('audio')!
    Object.defineProperty(audio, 'duration', { configurable: true, value: 60 })
    await fireEvent.loadedMetadata(audio)
    audio.currentTime = 20
    await fireEvent.timeUpdate(audio)
    expect(screen.getByRole('progressbar', { name: 'Article progress' })).toHaveAttribute('aria-valuenow', '33')
    await fireEvent.click(screen.getByRole('button', { name: 'Skip forward 10 seconds' }))
    expect(audio.currentTime).toBe(30)
    await fireEvent.click(screen.getByRole('button', { name: 'Play Article' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause Article' })).toHaveAttribute('aria-pressed', 'true'))
    await fireEvent.change(screen.getByRole('combobox', { name: 'Playback speed' }), { target: { value: '1.5' } })
    expect(audio.playbackRate).toBe(1.5)
    await fireEvent.ended(audio)
    expect(onEnded).toHaveBeenCalledTimes(1)
    await view.rerender({ src: '/next.mp3', label: 'Article', onEnded })
    expect(screen.getByRole('progressbar', { name: 'Article progress' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('button', { name: 'Play Article' })).toHaveAttribute('aria-pressed', 'false')
  })
})
