import { describe, expect, it } from 'vitest'
import { edgeEnabledIndex, nextEnabledIndex, typeaheadIndex } from './navigation'

describe('enabled-item navigation', () => {
  const items = [{}, { disabled: true }, {}, { disabled: true }]

  it('skips disabled items and wraps in either direction', () => {
    expect(nextEnabledIndex(items, 0, 1)).toBe(2)
    expect(nextEnabledIndex(items, 0, -1)).toBe(2)
    expect(nextEnabledIndex(items, -1, 1)).toBe(0)
    expect(nextEnabledIndex([{}, {}, {}], -1, -1)).toBe(2)
  })

  it('finds both edges and handles a list with no enabled item', () => {
    expect(edgeEnabledIndex(items, 'first')).toBe(0)
    expect(edgeEnabledIndex(items, 'last')).toBe(2)
    expect(nextEnabledIndex([{ disabled: true }], 0, 1)).toBe(-1)
    expect(edgeEnabledIndex([], 'first')).toBe(-1)
  })

  it('uses the next matching enabled item for menu typeahead', () => {
    const labels = [
      { label: 'Archive' }, { label: 'Add', disabled: true }, { label: 'Delete' }, { label: 'Apply' },
    ]
    expect(typeaheadIndex(labels, 'a', 0)).toBe(3)
    expect(typeaheadIndex(labels, 'de', 3)).toBe(2)
    expect(typeaheadIndex(labels, 'z', 0)).toBe(-1)
  })
})
