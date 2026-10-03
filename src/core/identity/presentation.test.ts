import { describe, expect, it } from 'vitest'
import { identityInitials, identityOverflow, visibleIdentities } from './presentation'
import type { Identity } from './types'

describe('identity presentation', () => {
  it('uses first and last initials with a deterministic empty fallback', () => {
    expect(identityInitials('  Avery   Chen ')).toBe('AC')
    expect(identityInitials('Ada')).toBe('AD')
    expect(identityInitials('  ')).toBe('?')
  })

  it('caps visible identities without mutating the source', () => {
    const identities: Identity[] = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }]
    expect(visibleIdentities(identities, 2).map(({ id }) => id)).toEqual(['a', 'b'])
    expect(identityOverflow(identities, 2)).toBe(1)
    expect(identityOverflow(identities, -1)).toBe(3)
    expect(identities).toHaveLength(3)
  })
})
