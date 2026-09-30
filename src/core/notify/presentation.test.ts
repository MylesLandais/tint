import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTIFICATION_SETTINGS, type Notification } from './contracts'
import { groupNotifications, notificationActions, notificationBadgeCount, withPolicyChannel, withQuietHours, withSourceChannel } from './presentation'

const rows: Notification[] = [
  { id: 'a', kind: 'mention', title: 'A', createdAt: '2026-08-01T09:00:00Z', read: false, href: '#a' },
  { id: 'b', kind: 'review', title: 'B', createdAt: '2026-08-02T09:00:00Z', read: true },
  { id: 'c', kind: 'mention', title: 'C', createdAt: '2026-08-03T09:00:00Z', read: false },
]

describe('notification presentation projection', () => {
  it('groups in first-seen order while preserving row order and custom keys', () => {
    expect(groupNotifications(rows, 'kind').map(({ key, notifications }) => [key, notifications.map(({ id }) => id)]))
      .toEqual([['mention', ['a', 'c']], ['review', ['b']]])
    expect(groupNotifications(rows, 'time', (row) => row.read ? 'read' : 'unread').map(({ key }) => key))
      .toEqual(['unread', 'read'])
  })

  it('derives fallback actions and badge count without inventing commands', () => {
    expect(notificationActions(rows[0])).toEqual([{ id: 'open', label: 'Open', href: '#a' }])
    expect(notificationActions(rows[1])).toEqual([])
    expect(notificationBadgeCount(0)).toBeNull()
    expect(notificationBadgeCount(100)).toBe('99+')
  })

  it('returns updated settings documents while leaving the input untouched', () => {
    const source = withSourceChannel(DEFAULT_NOTIFICATION_SETTINGS, 'src', 'off')
    const policy = withPolicyChannel(source, 'pol', 'digest')
    const quiet = withQuietHours(policy, { start: '22:00', end: '07:00' })
    expect(quiet.bySource).toEqual({ src: 'off' })
    expect(quiet.byPolicy).toEqual({ pol: 'digest' })
    expect(quiet.quietHours).toEqual({ start: '22:00', end: '07:00' })
    expect(DEFAULT_NOTIFICATION_SETTINGS.bySource).toEqual({})
    expect(DEFAULT_NOTIFICATION_SETTINGS.quietHours).toBeNull()
  })
})
