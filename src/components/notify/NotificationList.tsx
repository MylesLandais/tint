import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge'
import { Avatar } from '../identity'
import { cn } from '../../lib/utils'
import type { Notification } from './contracts'

export type NotificationListProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  notifications: readonly Notification[]
  groupBy?: 'time' | 'kind'
  groupKey?: (notification: Notification) => string
  onSelect?: (notification: Notification) => void
  empty?: ReactNode
}

function dayKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Generic grouped notification rows with host-defined kinds, actors, and actions. */
export function NotificationList({ notifications, groupBy = 'time', groupKey, onSelect, empty, className, ...props }: NotificationListProps) {
  if (notifications.length === 0) return <div data-tint-notification-list="" className={cn('px-2 py-4 text-sm text-tint-muted', className)} {...props}>{empty ?? 'No notifications.'}</div>
  const groups = new Map<string, Notification[]>()
  for (const notification of notifications) {
    const key = groupKey?.(notification) ?? (groupBy === 'kind' ? notification.kind : dayKey(notification.createdAt))
    const bucket = groups.get(key) ?? []
    bucket.push(notification)
    groups.set(key, bucket)
  }
  return (
    <div data-tint-notification-list="" className={cn('flex flex-col gap-3', className)} {...props}>
      {[...groups.entries()].map(([group, rows]) => (
        <section key={group} className="flex flex-col gap-1">
          <h3 className="m-0 px-2 text-xs font-semibold tracking-wide text-tint-muted uppercase">{group}</h3>
          <ul className="m-0 list-none p-0">
            {rows.map((notification) => (
              <li key={notification.id}>
                <div
                  data-tint-notification-row=""
                  data-read={notification.read || undefined}
                  data-tone={notification.tone}
                  className={cn('flex gap-2 rounded-lg px-2 py-2 text-left transition', !notification.read && 'bg-tint-accent-soft/50', onSelect && 'cursor-pointer hover:bg-tint-surface')}
                >
                  {notification.actor ? <Avatar identity={notification.actor} size="sm" decorative /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      {onSelect ? <button type="button" className="m-0 text-left text-sm font-medium text-tint-ink hover:underline" onClick={() => onSelect(notification)}>{notification.title}</button> : <p className="m-0 text-sm font-medium text-tint-ink">{notification.title}</p>}
                      <Badge tone="neutral">{notification.kind}</Badge>
                    </div>
                    {notification.subtitle ? <p className="m-0 mt-0.5 text-xs text-tint-muted">{notification.subtitle}</p> : null}
                    <p className="m-0 mt-1 text-xs text-tint-muted"><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time></p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {(notification.actions ?? (notification.href ? [{ id: 'open', label: 'Open', href: notification.href }] : [])).map((action) => action.href ? (
                        <a key={action.id} href={action.href} className="text-tint-accent underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>{action.label}</a>
                      ) : (
                        <button key={action.id} type="button" className="text-tint-accent hover:underline" onClick={(event) => { event.stopPropagation(); action.onSelect?.() }}>{action.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
