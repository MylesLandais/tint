import { describe, expect, it } from 'vitest'
import { applyBoardCommand, cardsForLane, type BoardDocument } from './contracts'

describe('board command integration', () => {
  it('moves a card between interleaved lanes without mutating the source document', () => {
    const document: BoardDocument = {
      schemaVersion: '1', id: 'board', revision: 'r7', metadata: {},
      lanes: [{ id: 'now', label: 'Now' }, { id: 'next', label: 'Next' }, { id: 'later', label: 'Later' }],
      cards: [
        { id: 'a', laneId: 'now', title: 'A', kind: 'task', preview: {} },
        { id: 'x', laneId: 'next', title: 'X', kind: 'graph', preview: {} },
        { id: 'b', laneId: 'now', title: 'B', kind: 'table', preview: {} },
        { id: 'y', laneId: 'later', title: 'Y', kind: 'media', preview: {} },
      ],
    }
    const moved = applyBoardCommand(document, { type: 'card.move', cardId: 'y', laneId: 'now', index: 1 })
    expect(cardsForLane(moved, 'now').map(({ id }) => id)).toEqual(['a', 'y', 'b'])
    expect(moved.cards.map(({ id }) => id)).toEqual(['a', 'x', 'y', 'b'])
    expect(moved.revision).toBe('r8')
    expect(cardsForLane(document, 'later').map(({ id }) => id)).toEqual(['y'])
    expect(document.revision).toBe('r7')
    expect(applyBoardCommand(moved, { type: 'card.move', cardId: 'y', laneId: 'now', index: 1 })).toBe(moved)
  })
})
