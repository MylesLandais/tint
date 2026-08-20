import type { HTMLAttributes, ReactNode } from 'react'
import { Badge, type BadgeTone } from '../badge'
import { cn } from '../../lib/utils'
import type { ActivityEvent, ActivitySignal } from './contracts'

export type ActivityFeedRowProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect'> & {
  event: ActivityEvent
  selected?: boolean
  onSelect?: (eventId: string) => void
  actions?: ReactNode
}

const SIGNAL_TONE: Record<ActivitySignal, BadgeTone> = {
  hot: 'danger',
  new: 'info',
  top: 'accent',
  rising: 'warning',
  artifact: 'success',
  notify: 'info',
  intent: 'accent',
}

/**
 * Digg-density activity row: rank, signal chips, engagement stats.
 *
 * Denser than ReaderPane on purpose — Activity is a separate document, not a
 * layout variant of FeedEntry.
 */
export function ActivityFeedRow({
  event,
  selected = false,
  onSelect,
  actions,
  className,
  ...props
}: ActivityFeedRowProps) {
  return (
    <article
      data-tint-activity-row=""
      data-selected={selected || undefined}
      className={cn(
        'grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-tint-border px-2 py-3',
        selected && 'bg-tint-accent-soft/40',
        onSelect && 'cursor-pointer hover:bg-tint-surface',
        className,
      )}
      onClick={onSelect ? () => onSelect(event.id) : undefined}
      onKeyDown={
        onSelect
          ? (eventKey) => {
              if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                eventKey.preventDefault()
                onSelect(event.id)
              }
            }
          : undefined
      }
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      {...props}
    >
      <span className="pt-0.5 text-center text-sm font-semibold tabular-nums text-tint-muted">
        {event.rank ?? '—'}
      </span>
      <div className="min-w-0">
        <h3 className="m-0 text-sm font-semibold text-tint-ink">
          <a
            href={event.href}
            className="text-inherit no-underline hover:underline"
            onClick={(click) => click.stopPropagation()}
          >
            {event.title}
          </a>
        </h3>
        <p className="m-0 mt-1 text-xs text-tint-muted">
          {event.attribution}
          <span className="mx-1">·</span>
          <time dateTime={event.publishedAt}>
            {new Date(event.publishedAt).toLocaleString()}
          </time>
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {event.signals.map((signal) => (
            <Badge key={signal} tone={SIGNAL_TONE[signal]}>
              {signal}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs tabular-nums text-tint-muted">
        <span title="Score">{event.score} pts</span>
        <span title="Comments">{event.commentCount} c</span>
        <span title="Shares">{event.shareCount} s</span>
        {actions}
      </div>
    </article>
  )
}
