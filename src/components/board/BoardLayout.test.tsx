import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardLayout } from './BoardLayout'
import type { BoardCard as BoardCardModel, BoardLane } from './contracts'

const lanes: BoardLane[] = [
  { id: 'now', label: 'Now' },
  { id: 'next', label: 'Next' },
  { id: 'later', label: 'Later' },
]

const cards: BoardCardModel[] = [
  {
    id: 'a',
    title: 'Alpha',
    laneId: 'now',
    kind: 'graph',
    preview: { kicker: 'graph' },
  },
  {
    id: 'b',
    title: 'Beta',
    laneId: 'now',
    kind: 'table',
    preview: { kicker: 'table' },
  },
  {
    id: 'c',
    title: 'Gamma',
    laneId: 'next',
    kind: 'media',
    preview: { kicker: 'media' },
  },
]

describe('BoardLayout', () => {
  it('masonry renders every card as a list item in source order', () => {
    render(
      <BoardLayout cards={cards} lanes={lanes} variant="masonry" label="Demo board" />,
    )

    const list = screen.getByRole('list', { name: 'Demo board' })
    expect(list).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items.map((el) => el.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Alpha'),
        expect.stringContaining('Beta'),
        expect.stringContaining('Gamma'),
      ]),
    )
    expect(items).toHaveLength(3)
    expect(items.map((el) => el.getAttribute('data-row-id'))).toEqual(['a', 'b', 'c'])
  })

  it('kanban renders one region per lane including empty', () => {
    render(<BoardLayout cards={cards} lanes={lanes} variant="kanban" />)

    expect(screen.getByRole('region', { name: 'Now' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Next' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Later' })).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('reports selection from a card', () => {
    const onSelect = vi.fn()
    render(
      <BoardLayout
        cards={cards}
        lanes={lanes}
        variant="masonry"
        onSelect={onSelect}
        label="Board"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Beta/i }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('shows the empty state when there are no cards in masonry', () => {
    render(
      <BoardLayout
        cards={[]}
        lanes={lanes}
        variant="masonry"
        empty={<p>Nothing here.</p>}
      />,
    )
    expect(screen.getByText('Nothing here.')).toBeInTheDocument()
  })
})
