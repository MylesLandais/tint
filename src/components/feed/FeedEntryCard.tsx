import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge'
import { cn } from '../../lib/utils'
import type { ArtifactStatus, FeedEntry } from './contracts'

export type FeedEntryCardProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect'> & {
  entry: FeedEntry
  /** Source handle / attribution line. */
  sourceLabel?: string
  selected?: boolean
  onSelect?: (entryId: string) => void
  /** Optional trailing actions (mark read, open, …). */
  actions?: ReactNode
}

const ARTIFACT_LABEL: Record<Exclude<ArtifactStatus, 'none'>, string> = {
  queued: 'queued',
  downloading: 'downloading',
  ready: 'ready',
}

/**
 * Card surface for magazine / wall / carousel layouts.
 *
 * Unread is a data attribute + left accent rather than a second store — the host
 * already owns `readState` on the entry.
 */
export function FeedEntryCard({
  entry,
  sourceLabel,
  selected = false,
  onSelect,
  actions,
  className,
  ...props
}: FeedEntryCardProps) {
  const unread = entry.readState === 'unread'
  const artifact =
    entry.artifactStatus && entry.artifactStatus !== 'none'
      ? ARTIFACT_LABEL[entry.artifactStatus]
      : null

  return (
    <article
      data-tint-feed-entry=""
      data-tint-feed-variant="card"
      data-unread={unread || undefined}
      data-selected={selected || undefined}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-tint-border bg-tint-panel text-left shadow-sm transition',
        unread && 'border-l-2 border-l-tint-accent',
        selected && 'ring-2 ring-tint-accent',
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
      {entry.media ? (
        <div className="aspect-video w-full overflow-hidden bg-tint-surface">
          {/* Host supplies URLs; demos use local placeholders so the card never needs network. */}
          <img
            src={entry.media.url}
            alt=""
            width={entry.media.width}
            height={entry.media.height}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold leading-snug text-tint-ink">{entry.title}</h3>
          {artifact ? (
            <Badge tone={artifact === 'ready' ? 'success' : 'info'} className="shrink-0">
              {artifact}
            </Badge>
          ) : null}
        </div>
        {sourceLabel ? (
          <p className="m-0 text-xs text-tint-muted">
            {sourceLabel}
            <span className="mx-1 text-tint-border">·</span>
            <time dateTime={entry.publishedAt}>
              {new Date(entry.publishedAt).toLocaleString()}
            </time>
          </p>
        ) : null}
        <p className="m-0 line-clamp-3 text-sm leading-relaxed text-tint-muted">{entry.excerpt}</p>
        {entry.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {entry.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-1">{actions}</div> : null}
      </div>
    </article>
  )
}
