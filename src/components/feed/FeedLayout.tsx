import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { FeedEntry } from './contracts'
import { FeedEntryCard } from './FeedEntryCard'
import { FeedEntryRow } from './FeedEntryRow'

export type FeedLayoutVariant =
  | 'wall'
  | 'list'
  | 'magazine'
  | 'ticker'
  | 'carousel'
  | 'feed'

export type FeedLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  entries: readonly FeedEntry[]
  variant?: FeedLayoutVariant
  /** Map sourceId → display label for attribution lines. */
  sourceLabels?: Readonly<Record<string, string>>
  selectedId?: string | null
  onSelect?: (entryId: string) => void
  /** Optional per-entry trailing actions. */
  renderActions?: (entry: FeedEntry) => ReactNode
  empty?: ReactNode
}

/**
 * Presentational layout over one `FeedEntry[]`.
 *
 * Six variants share the same rows so switching layout never remounts host
 * selection state or invents a second document.
 */
export function FeedLayout({
  entries,
  variant = 'feed',
  sourceLabels,
  selectedId = null,
  onSelect,
  renderActions,
  empty,
  className,
  ...props
}: FeedLayoutProps) {
  if (entries.length === 0) {
    return (
      <div
        data-tint-feed-layout=""
        data-variant={variant}
        className={cn('text-sm text-tint-muted', className)}
        {...props}
      >
        {empty ?? 'No entries.'}
      </div>
    )
  }

  const labelFor = (sourceId: string) => sourceLabels?.[sourceId]

  if (variant === 'list' || variant === 'ticker') {
    return (
      <div
        data-tint-feed-layout=""
        data-variant={variant}
        className={cn(
          variant === 'ticker'
            ? 'flex gap-0 overflow-x-auto border border-tint-border [&>*]:min-w-[18rem] [&>*]:shrink-0 [&>*]:border-b-0 [&>*]:border-r'
            : 'divide-y divide-tint-border rounded-lg border border-tint-border',
          className,
        )}
        {...props}
      >
        {entries.map((entry) => (
          <FeedEntryRow
            key={entry.id}
            entry={entry}
            sourceLabel={labelFor(entry.sourceId)}
            selected={selectedId === entry.id}
            onSelect={onSelect}
            actions={renderActions?.(entry)}
          />
        ))}
      </div>
    )
  }

  if (variant === 'magazine') {
    const [hero, ...rest] = entries
    return (
      <div
        data-tint-feed-layout=""
        data-variant={variant}
        className={cn('grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]', className)}
        {...props}
      >
        {hero ? (
          <FeedEntryCard
            entry={hero}
            sourceLabel={labelFor(hero.sourceId)}
            selected={selectedId === hero.id}
            onSelect={onSelect}
            actions={renderActions?.(hero)}
            className="min-h-[16rem]"
          />
        ) : null}
        <div className="flex flex-col gap-2">
          {rest.map((entry) => (
            <FeedEntryRow
              key={entry.id}
              entry={entry}
              sourceLabel={labelFor(entry.sourceId)}
              selected={selectedId === entry.id}
              onSelect={onSelect}
              actions={renderActions?.(entry)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'carousel') {
    return (
      <div
        data-tint-feed-layout=""
        data-variant={variant}
        className={cn('flex gap-3 overflow-x-auto pb-1', className)}
        {...props}
      >
        {entries.map((entry) => (
          <FeedEntryCard
            key={entry.id}
            entry={entry}
            sourceLabel={labelFor(entry.sourceId)}
            selected={selectedId === entry.id}
            onSelect={onSelect}
            actions={renderActions?.(entry)}
            className="w-72 shrink-0"
          />
        ))}
      </div>
    )
  }

  // wall + feed
  return (
    <div
      data-tint-feed-layout=""
      data-variant={variant}
      className={cn(
        variant === 'wall'
          ? 'columns-1 gap-3 sm:columns-2 xl:columns-3 [&>*]:mb-3 [&>*]:break-inside-avoid'
          : 'flex flex-col gap-3',
        className,
      )}
      {...props}
    >
      {entries.map((entry) => (
        <FeedEntryCard
          key={entry.id}
          entry={entry}
          sourceLabel={labelFor(entry.sourceId)}
          selected={selectedId === entry.id}
          onSelect={onSelect}
          actions={renderActions?.(entry)}
        />
      ))}
    </div>
  )
}
