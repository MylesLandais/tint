import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge'
import { cn } from '../../lib/utils'
import type { Notification } from './contracts'

export type NotificationListProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  notifications: readonly Notification[]
  /** Group rows by calendar day or by sourceId. */
  groupBy?: 'time' | 'source'
  /** Map sourceId → label when grouping by source. */
  sourceLabels?: Readonly<Record<string, string>>
  onSelect?: (notification: Notification) => void
  /** Optional "why" link target builder — defaults to notification.href. */
  whyHref?: (notification: Notification) => string | undefined
  empty?: ReactNode
}

function dayKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Grouped notification rows. Every row can deep-link the entry and the policy
 * ("why") so the bell never invents a match the feed cannot explain.
 */
export function NotificationList({
  notifications,
  groupBy = 'time',
  sourceLabels,
  onSelect,
  whyHref,
  empty,
  className,
  ...props
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div
        data-tint-notification-list=""
        className={cn('px-2 py-4 text-sm text-tint-muted', className)}
        {...props}
      >
        {empty ?? 'No notifications.'}
      </div>
    )
  }

  const groups = new Map<string, Notification[]>()
  for (const notification of notifications) {
    const key =
      groupBy === 'source'
        ? (sourceLabels?.[notification.sourceId ?? ''] ?? notification.sourceId ?? 'System')
        : dayKey(notification.createdAt)
    const bucket = groups.get(key) ?? []
    bucket.push(notification)
    groups.set(key, bucket)
  }

  return (
    <div data-tint-notification-list="" className={cn('flex flex-col gap-3', className)} {...props}>
      {[...groups.entries()].map(([group, rows]) => (
        <section key={group} className="flex flex-col gap-1">
          <h3 className="m-0 px-2 text-xs font-semibold tracking-wide text-tint-muted uppercase">
            {group}
          </h3>
          <ul className="m-0 list-none p-0">
            {rows.map((notification) => {
              const why = whyHref?.(notification)
              return (
                <li key={notification.id}>
                  <div
                    data-tint-notification-row=""
                    data-read={notification.read || undefined}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg px-2 py-2 text-left transition',
                      !notification.read && 'bg-tint-accent-soft/50',
                      onSelect && 'cursor-pointer hover:bg-tint-surface',
                    )}
                    onClick={onSelect ? () => onSelect(notification) : undefined}
                    onKeyDown={
                      onSelect
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onSelect(notification)
                            }
                          }
                        : undefined
                    }
                    role={onSelect ? 'button' : undefined}
                    tabIndex={onSelect ? 0 : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="m-0 text-sm font-medium text-tint-ink">{notification.title}</p>
                      <Badge tone="neutral">{notification.kind}</Badge>
                    </div>
                    <p className="m-0 text-xs text-tint-muted">
                      <time dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </time>
                      {notification.disposition ? (
                        <>
                          <span className="mx-1">·</span>
                          {notification.disposition}
                        </>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <a
                        className="text-tint-accent underline-offset-2 hover:underline"
                        href={notification.href}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Open entry
                      </a>
                      {notification.policyId ? (
                        <a
                          className="text-tint-accent underline-offset-2 hover:underline"
                          href={
                            why ??
                            `#/components/policy?policy=${encodeURIComponent(notification.policyId)}`
                          }
                          onClick={(event) => event.stopPropagation()}
                        >
                          Why
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
