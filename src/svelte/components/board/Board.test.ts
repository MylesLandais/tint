import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BoardCard as BoardCardModel, BoardLane } from '../../../core/board'
import BoardCard from './BoardCard.svelte'
import BoardDetail from './BoardDetail.svelte'
import BoardDetailFixture from './BoardDetailFixture.svelte'
import BoardFixture from './BoardFixture.svelte'
import BoardLayout from './BoardLayout.svelte'
import BoardLayoutToggle from './BoardLayoutToggle.svelte'

const lanes: BoardLane[] = [
  { id: 'now', label: 'Now' }, { id: 'next', label: 'Next' }, { id: 'later', label: 'Later' },
]
const cards: BoardCardModel[] = [
  { id: 'a', title: 'Alpha', laneId: 'now', kind: 'graph', preview: { kicker: 'Graph preview', metrics: ['ready'] } },
  { id: 'b', title: 'Beta', laneId: 'now', kind: 'table', preview: {} },
  { id: 'c', title: 'Gamma', laneId: 'next', kind: 'media', preview: {} },
]

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Svelte board', () => {
  it('renders card chrome and reports controlled selection by click and keyboard', async () => {
    const onSelect = vi.fn()
    render(BoardCard, { card: cards[0], selected: true, onSelect })
    const article = screen.getByRole('article')
    const select = screen.getByRole('button', { name: 'Alpha' })
    expect(article).toHaveAttribute('data-kind', 'graph')
    expect(article).toHaveAttribute('data-selected')
    expect(select).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('GRAPH')).toBeInTheDocument()
    expect(screen.getByText('Graph preview')).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
    await fireEvent.click(article)
    await fireEvent.click(select)
    expect(onSelect.mock.calls).toEqual([['a'], ['a']])
  })

  it('keeps action buttons independent and renders host preview snippets', async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(BoardFixture, { onSelect, onAction })
    expect(screen.getByText('custom Alpha')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'More Alpha' }))
    expect(onAction).toHaveBeenCalledWith('a')
    expect(onSelect).not.toHaveBeenCalled()
    const article = screen.getByText('Alpha').closest('[data-tint-board-card]')!
    await fireEvent.click(article)
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('renders masonry cards in source order and each kanban lane including empty lanes', () => {
    const masonry = render(BoardLayout, { cards, lanes, variant: 'masonry', label: 'Demo board' })
    expect(screen.getByRole('list', { name: 'Demo board' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-row-id'))).toEqual(['a', 'b', 'c'])
    masonry.unmount()

    render(BoardLayout, { cards, lanes, variant: 'kanban' })
    expect(screen.getByRole('region', { name: 'Now' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Next' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Later' })).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Now cards' }).querySelectorAll('[role="listitem"]')).toHaveLength(2)
  })

  it('reflows the masonry placement when its own container changes width', async () => {
    let width = 700
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute('data-masonry') ? width : 0
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
    const callbacks: ResizeObserverCallback[] = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { callbacks.push(callback) }
      observe() {}
      disconnect() {}
    })
    render(BoardLayout, { cards, lanes, variant: 'masonry', gap: 12, targetWidth: 320 })
    const items = screen.getAllByRole('listitem')
    await waitFor(() => expect(items[1]).toHaveStyle({ transform: 'translate(356px, 0px)' }))
    width = 340
    callbacks[0]?.([], {} as ResizeObserver)
    await waitFor(() => expect(items[1]).toHaveStyle({ transform: 'translate(0px, 112px)' }))
  })

  it('renders the detail empty state and a host live surface', async () => {
    const view = render(BoardDetailFixture, { card: null })
    expect(screen.getByText('Select a card to open its live surface.')).toBeInTheDocument()
    expect(view.container.querySelector('[data-empty]')).toBeInTheDocument()
    await view.rerender({ card: cards[1] })
    expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByText('TABLE')).toBeInTheDocument()
    expect(screen.getByText('Live surface')).toBeInTheDocument()
    view.unmount()
    render(BoardDetail, { card: null, empty: 'Pick a card.' })
    expect(screen.getByText('Pick a card.')).toBeInTheDocument()
  })

  it('reports layout changes while keeping the host value authoritative', async () => {
    const onChange = vi.fn()
    const view = render(BoardLayoutToggle, { value: 'masonry', onChange })
    const masonry = screen.getByRole('button', { name: 'Masonry' })
    const kanban = screen.getByRole('button', { name: 'Kanban' })
    expect(masonry).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(kanban)
    expect(onChange).toHaveBeenCalledWith('kanban')
    expect(masonry).toHaveAttribute('aria-pressed', 'true')
    await view.rerender({ value: 'kanban', onChange, disabled: true })
    expect(kanban).toHaveAttribute('aria-pressed', 'true')
    expect(kanban).toBeDisabled()
  })
})
