import { describe, expect, it } from 'vitest'
import { toTreeSet, toggleTreeId, visibleTreeEntries } from './model'

const nodes = [
  { id: 'album', children: [{ id: 'track-a' }, { id: 'track-b' }] },
  { id: 'other' },
]

describe('tree model', () => {
  it('flattens only expanded branches with parent and first-child links', () => {
    expect(visibleTreeEntries(nodes, [])).toMatchObject([
      { id: 'album', parentId: null, depth: 0, hasChildren: true },
      { id: 'other', parentId: null, depth: 0, hasChildren: false },
    ])
    expect(visibleTreeEntries(nodes, new Set(['album']))).toMatchObject([
      { id: 'album', firstChildId: 'track-a' },
      { id: 'track-a', parentId: 'album', depth: 1 },
      { id: 'track-b', parentId: 'album', depth: 1 },
      { id: 'other', parentId: null },
    ])
  })

  it('toggles controlled id collections without mutating them', () => {
    const selected = new Set(['track-a'])
    expect(toggleTreeId(selected, 'track-b')).toEqual(['track-a', 'track-b'])
    expect(toggleTreeId(selected, 'track-a')).toEqual([])
    expect(toTreeSet(selected)).not.toBe(selected)
    expect([...selected]).toEqual(['track-a'])
  })
})
