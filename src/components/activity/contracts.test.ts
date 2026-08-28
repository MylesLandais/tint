import { describe, expect, it } from 'vitest'
import { sortActivityEvents } from './contracts'
import { DEMO_ACTIVITY } from '../../docs/fixtures/demoDocuments'

describe('sortActivityEvents', () => {
  it('ranks hot, new, and top differently', () => {
    const now = Date.parse('2026-08-20T12:00:00.000Z')
    const hot = sortActivityEvents(DEMO_ACTIVITY.events, 'hot', now)
    const neu = sortActivityEvents(DEMO_ACTIVITY.events, 'new', now)
    const top = sortActivityEvents(DEMO_ACTIVITY.events, 'top', now)

    expect(hot[0]?.rank).toBe(1)
    expect(neu[0]?.id).toBe('act-6')
    expect(top[0]?.id).toBe('act-5')
    expect(new Set(hot.map((event) => event.id)).size).toBe(DEMO_ACTIVITY.events.length)
  })
})
