import { describe, expect, it } from 'vitest'
import { sortActivityEvents, type ActivityEvent } from './contracts'

describe('activity sort projection', () => {
  it('keeps the source immutable while assigning ranks for each controlled sort', () => {
    const events: ActivityEvent[] = [
      { id: 'old', title: 'Old', href: '#old', publishedAt: '2026-08-01T00:00:00Z', signals: [], score: 100, commentCount: 0, shareCount: 0, attribution: 'A' },
      { id: 'new', title: 'New', href: '#new', publishedAt: '2026-08-20T00:00:00Z', signals: [], score: 2, commentCount: 0, shareCount: 0, attribution: 'B' },
    ]
    const now = Date.parse('2026-08-20T01:00:00Z')
    expect(sortActivityEvents(events, 'new', now).map(({ id, rank }) => [id, rank])).toEqual([['new', 1], ['old', 2]])
    expect(sortActivityEvents(events, 'top', now).map(({ id }) => id)).toEqual(['old', 'new'])
    expect(events.map(({ rank }) => rank)).toEqual([undefined, undefined])
  })
})
