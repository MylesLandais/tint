import type { Notification, NotificationAction, NotificationSettings, NotifyChannel } from './contracts'

export const NOTIFY_CHANNELS: readonly NotifyChannel[] = ['off', 'instant', 'digest']

export type NotificationGroup = { key: string; notifications: readonly Notification[] }

export function notificationDayKey(iso: string, locale?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function groupNotifications(notifications: readonly Notification[], groupBy: 'time' | 'kind', groupKey?: (notification: Notification) => string): NotificationGroup[] {
  const groups = new Map<string, Notification[]>()
  for (const notification of notifications) {
    const key = groupKey?.(notification) ?? (groupBy === 'kind' ? notification.kind : notificationDayKey(notification.createdAt))
    const bucket = groups.get(key) ?? []
    bucket.push(notification)
    groups.set(key, bucket)
  }
  return [...groups].map(([key, rows]) => ({ key, notifications: rows }))
}

export function notificationActions(notification: Notification): readonly NotificationAction[] {
  return notification.actions ?? (notification.href ? [{ id: 'open', label: 'Open', href: notification.href }] : [])
}

export function notificationBadgeCount(unreadCount: number): string | null {
  if (unreadCount <= 0) return null
  return unreadCount > 99 ? '99+' : String(unreadCount)
}

export function withDefaultChannel(settings: NotificationSettings, defaultChannel: NotifyChannel): NotificationSettings {
  return { ...settings, defaultChannel }
}

export function withSourceChannel(settings: NotificationSettings, sourceId: string, channel: NotifyChannel): NotificationSettings {
  return { ...settings, bySource: { ...settings.bySource, [sourceId]: channel } }
}

export function withPolicyChannel(settings: NotificationSettings, policyId: string, channel: NotifyChannel): NotificationSettings {
  return { ...settings, byPolicy: { ...settings.byPolicy, [policyId]: channel } }
}

export function withQuietHours(settings: NotificationSettings, quietHours: NotificationSettings['quietHours']): NotificationSettings {
  return { ...settings, quietHours }
}
