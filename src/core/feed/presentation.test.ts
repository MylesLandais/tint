import { describe, expect, it } from 'vitest'
import { highlightPieces } from './highlights'
import { narrationProgress, narrationTimeAfterSkip } from './narration'
import { resizedPaneWidth, splitPaneMode } from './split'

describe('feed presentation decisions', () => {
  it('clips highlight ranges and overlaps without duplicating body text', () => {
    const pieces = highlightPieces('abcdefghij', [
      { id: 'b', start: 4, end: 20, tone: 'warning' },
      { id: 'a', start: -2, end: 6 },
      { id: 'invalid', start: 9, end: 8 },
    ])
    expect(pieces.map(({ content }) => content).join('')).toBe('abcdefghij')
    expect(pieces.filter(({ highlight }) => highlight).map(({ key, content }) => ({ key, content })))
      .toEqual([{ key: 'a', content: 'abcdef' }, { key: 'b', content: 'ghij' }])
  })

  it('clamps pane drag intents and chooses mode from the container', () => {
    expect(splitPaneMode(850, true)).toBe('stacked')
    expect(splitPaneMode(850, false)).toBe('columns')
    expect(resizedPaneWidth(250, 900, 1000, 120, true)).toBe(760)
    expect(resizedPaneWidth(250, -900, 1000, 120, true)).toBe(120)
  })

  it('clamps narration skips and progress to media duration', () => {
    expect(narrationTimeAfterSkip(5, -10, 90)).toBe(0)
    expect(narrationTimeAfterSkip(85, 10, 90)).toBe(90)
    expect(narrationProgress(45, 90)).toBe(50)
    expect(narrationProgress(100, 90)).toBe(100)
    expect(narrationProgress(3, Number.NaN)).toBe(0)
  })
})
