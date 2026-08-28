import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  deriveNotifications,
  isInQuietHours,
} from './contracts'
import { DEMO_FEED } from '../../docs/fixtures/demoDocuments'

describe('isInQuietHours', () => {
  it('handles a same-day window', () => {
    const at = new Date('2026-08-20T22:30:00')
    expect(isInQuietHours(at, { start: '22:00', end: '07:00' })).toBe(true)
    expect(isInQuietHours(new Date('2026-08-20T12:00:00'), { start: '22:00', end: '07:00' })).toBe(
      false,
    )
  })

  it('treats null as never quiet', () => {
    expect(isInQuietHours(new Date(), null)).toBe(false)
  })
})

describe('deriveNotifications', () => {
  it('projects matches the feed can explain', () => {
    const rows = deriveNotifications(DEMO_FEED, DEFAULT_NOTIFICATION_SETTINGS)
    const matchIds = rows.filter((row) => row.kind === 'match').map((row) => row.id)
    expect(matchIds).toContain('match:pol-mk-cache:entry-mk-yt-1')
    expect(matchIds).toContain('match:pol-k2s-auto:entry-k2s-1')
  })

  it('honours per-source off and includes artifact + health rows', () => {
    const rows = deriveNotifications(DEMO_FEED, {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      bySource: { 'src-mk-yt': 'off' },
    })
    expect(rows.some((row) => row.sourceId === 'src-mk-yt' && row.kind === 'match')).toBe(false)
    // Artifact rows also honour bySource off for that source; other sources still surface.
    expect(rows.some((row) => row.kind === 'artifact_ready' && row.sourceId !== 'src-mk-yt')).toBe(
      true,
    )
    expect(rows.some((row) => row.kind === 'source_health' && row.sourceId === 'src-k2s')).toBe(
      true,
    )
  })

  it('never invents a match without a PolicyMatch row', () => {
    const empty = { ...DEMO_FEED, matches: [] as const }
    const rows = deriveNotifications(empty, DEFAULT_NOTIFICATION_SETTINGS)
    expect(rows.every((row) => row.kind !== 'match')).toBe(true)
  })
})
