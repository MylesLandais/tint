import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from '../button'
import { cn } from '../../lib/utils'
import {
  sortActivityEvents,
  type ActivityEvent,
  type ActivitySort,
} from './contracts'
import { ActivityFeedRow } from './ActivityFeedRow'

export type ActivityFeedProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  events: readonly ActivityEvent[]
  sort?: ActivitySort
  onSortChange?: (sort: ActivitySort) => void
  selectedId?: string | null
  onSelect?: (eventId: string) => void
  renderActions?: (event: ActivityEvent) => ReactNode
  empty?: ReactNode
  /** Override clock for hot ranking in tests. */
  now?: number
}

const SORTS: readonly ActivitySort[] = ['hot', 'new', 'top']

/**
 * Sorted Digg-style activity list.
 *
 * Sort is controlled so the host can deep-link `?sort=top` without the feed
 * inventing a second ranking store.
 */
export function ActivityFeed({
  events,
  sort = 'hot',
  onSortChange,
  selectedId = null,
  onSelect,
  renderActions,
  empty,
  now,
  className,
  ...props
}: ActivityFeedProps) {
  const ranked = sortActivityEvents(events, sort, now)

  return (
    <div data-tint-activity-feed="" className={cn('flex flex-col', className)} {...props}>
      <div
        role="group"
        aria-label="Activity sort"
        className="mb-2 flex flex-wrap gap-1 border-b border-tint-border pb-2"
      >
        {SORTS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={sort === value ? 'primary' : 'ghost'}
            aria-pressed={sort === value}
            onClick={() => onSortChange?.(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      {ranked.length === 0 ? (
        <p className="m-0 px-2 py-6 text-sm text-tint-muted">{empty ?? 'No activity.'}</p>
      ) : (
        ranked.map((event) => (
          <ActivityFeedRow
            key={event.id}
            event={event}
            selected={selectedId === event.id}
            onSelect={onSelect}
            actions={renderActions?.(event)}
          />
        ))
      )}
    </div>
  )
}
