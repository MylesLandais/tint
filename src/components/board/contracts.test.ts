import { describe, expect, it } from 'vitest'
import {
  applyBoardCommand,
  cardsForLane,
  nextBoardRevision,
  type BoardCard,
  type BoardDocument,
} from './contracts'

const lanes = [
  { id: 'now', label: 'Now' },
  { id: 'next', label: 'Next' },
  { id: 'later', label: 'Later' },
] as const

function card(
  id: string,
  laneId: string,
  title = id,
): BoardCard {
  return {
    id,
    title,
    laneId,
    kind: 'graph',
    preview: { kicker: 'preview' },
  }
}

function doc(cards: readonly BoardCard[]): BoardDocument {
  return {
    schemaVersion: '1',
    id: 'board-1',
    revision: 'r1',
    lanes: [...lanes],
    cards,
    metadata: {},
  }
}

describe('nextBoardRevision', () => {
  it('increments a numeric suffix', () => {
    expect(nextBoardRevision('r1')).toBe('r2')
    expect(nextBoardRevision('r12')).toBe('r13')
  })

  it('falls back when the token is not numeric', () => {
    expect(nextBoardRevision('initial')).toBe('r1')
  })
})

describe('cardsForLane', () => {
  it('returns cards in document order for one lane', () => {
    const document = doc([
      card('a', 'now'),
      card('b', 'next'),
      card('c', 'now'),
    ])
    expect(cardsForLane(document, 'now').map((c) => c.id)).toEqual(['a', 'c'])
    expect(cardsForLane(document, 'later')).toEqual([])
  })
})

describe('applyBoardCommand', () => {
  it('creates a card and bumps revision', () => {
    const document = doc([])
    const next = applyBoardCommand(document, {
      type: 'card.create',
      card: card('a', 'now'),
    })
    expect(next).not.toBe(document)
    expect(next.revision).toBe('r2')
    expect(next.cards).toHaveLength(1)
  })

  it('rejects a duplicate id without changing the document', () => {
    const document = doc([card('a', 'now')])
    const next = applyBoardCommand(document, {
      type: 'card.create',
      card: card('a', 'next'),
    })
    expect(next).toBe(document)
  })

  it('rejects create into an unknown lane', () => {
    const document = doc([])
    const next = applyBoardCommand(document, {
      type: 'card.create',
      card: card('a', 'missing'),
    })
    expect(next).toBe(document)
  })

  it('updates a card and returns identity when the patch is a no-op', () => {
    const existing = card('a', 'now', 'Alpha')
    const document = doc([existing])
    const renamed = applyBoardCommand(document, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Beta' },
    })
    expect(renamed.cards[0]?.title).toBe('Beta')
    expect(renamed.revision).toBe('r2')

    const noop = applyBoardCommand(renamed, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Beta' },
    })
    expect(noop).toBe(renamed)
  })

  it('deletes a card', () => {
    const document = doc([card('a', 'now'), card('b', 'next')])
    const next = applyBoardCommand(document, { type: 'card.delete', cardId: 'a' })
    expect(next.cards.map((c) => c.id)).toEqual(['b'])
    expect(applyBoardCommand(document, { type: 'card.delete', cardId: 'missing' })).toBe(
      document,
    )
  })

  it('moves a card into another lane at a clamped index', () => {
    const document = doc([
      card('a', 'now'),
      card('b', 'next'),
      card('c', 'next'),
    ])
    const next = applyBoardCommand(document, {
      type: 'card.move',
      cardId: 'a',
      laneId: 'next',
      index: 1,
    })
    expect(cardsForLane(next, 'next').map((c) => c.id)).toEqual(['b', 'a', 'c'])
    expect(cardsForLane(next, 'now')).toEqual([])
  })

  it('moves within a lane and returns identity when the index is unchanged', () => {
    const document = doc([
      card('a', 'now'),
      card('b', 'now'),
      card('c', 'now'),
    ])
    const noop = applyBoardCommand(document, {
      type: 'card.move',
      cardId: 'b',
      laneId: 'now',
      index: 1,
    })
    expect(noop).toBe(document)

    const next = applyBoardCommand(document, {
      type: 'card.move',
      cardId: 'c',
      laneId: 'now',
      index: 0,
    })
    expect(cardsForLane(next, 'now').map((c) => c.id)).toEqual(['c', 'a', 'b'])
  })

  it('places a card into an empty lane between existing lanes', () => {
    const document = doc([card('a', 'now'), card('b', 'later')])
    const next = applyBoardCommand(document, {
      type: 'card.move',
      cardId: 'a',
      laneId: 'next',
      index: 0,
    })
    expect(next.cards.map((c) => c.id)).toEqual(['a', 'b'])
    expect(next.cards[0]?.laneId).toBe('next')
  })

  it('reorders cards by full id list', () => {
    const document = doc([card('a', 'now'), card('b', 'now'), card('c', 'next')])
    const next = applyBoardCommand(document, {
      type: 'card.reorder',
      cardIds: ['c', 'a', 'b'],
    })
    expect(next.cards.map((c) => c.id)).toEqual(['c', 'a', 'b'])
    expect(applyBoardCommand(document, { type: 'card.reorder', cardIds: ['a', 'b', 'c'] })).toBe(
      document,
    )
  })

  it('rejects reorder when the id set does not match', () => {
    const document = doc([card('a', 'now'), card('b', 'now')])
    expect(
      applyBoardCommand(document, { type: 'card.reorder', cardIds: ['a'] }),
    ).toBe(document)
    expect(
      applyBoardCommand(document, { type: 'card.reorder', cardIds: ['a', 'x'] }),
    ).toBe(document)
  })
})
