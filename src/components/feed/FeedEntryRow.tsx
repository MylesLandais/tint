import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge'
import { cn } from '../../lib/utils'
import type { ArtifactStatus, FeedEntry } from './contracts'

export type FeedEntryRowProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect'> & {
  entry: FeedEntry
  sourceLabel?: string
  selected?: boolean
  onSelect?: (entryId: string) => void
  actions?: ReactNode
}

const ARTIFACT_LABEL: Record<Exclude<ArtifactStatus, 'none'>, string> = {
  queued: 'queued',
  downloading: 'downloading',
  ready: 'ready',
}

/** Compact list/ticker row — denser than FeedEntryCard, same entry contract. */
export function FeedEntryRow({
  entry,
  sourceLabel,
  selected = false,
  onSelect,
  actions,
  className,
  ...props
}: FeedEntryRowProps) {
  const unread = entry.readState === 'unread'
  const artifact =
    entry.artifactStatus && entry.artifactStatus !== 'none'
      ? ARTIFACT_LABEL[entry.artifactStatus]
      : null

  return (
    <article
      data-tint-feed-entry=""
      data-tint-feed-variant="row"
      data-unread={unread || undefined}
      data-selected={selected || undefined}
      className={cn(
        'flex items-start gap-3 border-b border-tint-border px-2 py-2.5 text-left transition last:border-b-0',
        unread && 'bg-tint-accent-soft/40',
        selected && 'bg-tint-surface ring-1 ring-inset ring-tint-accent',
        onSelect && 'cursor-pointer hover:bg-tint-surface',
        className,
      )}
      onClick={onSelect ? () => onSelect(entry.id) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(entry.id)
              }
            }
          : undefined
      }
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      {...props}
    >
      <span
        className={cn(
          'mt-1.5 size-1.5 shrink-0 rounded-full',
          unread ? 'bg-tint-accent' : 'bg-transparent',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="m-0 truncate text-sm font-medium text-tint-ink">{entry.title}</h3>
          {artifact ? (
            <Badge tone={artifact === 'ready' ? 'success' : 'info'}>{artifact}</Badge>
          ) : null}
        </div>
        <p className="m-0 mt-0.5 truncate text-xs text-tint-muted">
          {sourceLabel ? (
            <>
              {sourceLabel}
              <span className="mx-1">·</span>
            </>
          ) : null}
          <time dateTime={entry.publishedAt}>
            {new Date(entry.publishedAt).toLocaleString()}
          </time>
          <span className="mx-1">·</span>
          {entry.excerpt}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </article>
  )
}
