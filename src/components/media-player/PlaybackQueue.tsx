import { Pause, Play } from 'lucide-react'
import { useEffect, useState, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import { formatTime, MediaPlaceholder } from '../media'

export type PlaybackQueueStatus = 'idle' | 'playing' | 'paused' | 'ended'

export type PlaybackQueueItem = {
  id: string
  title: string
  subtitle?: string
  artwork?: string
  href?: string
  durationSeconds?: number
}

export type PlaybackQueueProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> & {
  items: readonly PlaybackQueueItem[]
  currentItemId?: string | null
  status?: PlaybackQueueStatus
  positionSeconds?: number
  label?: string
  emptyLabel?: string
  onSelect?: (item: PlaybackQueueItem, index: number) => void
}

/**
 * Controlled now-playing list. The host owns queue order and playback; this
 * component only presents the current item and emits selection intent.
 */
export function PlaybackQueue({
  items,
  currentItemId,
  status = 'idle',
  positionSeconds = 0,
  label = 'Playback queue',
  emptyLabel = 'Nothing is queued.',
  onSelect,
  className,
  ...props
}: PlaybackQueueProps) {
  const currentIndex = items.findIndex((item) => item.id === currentItemId)

  return (
    <section
      data-tint-playback-queue=""
      aria-label={label}
      className={cn(
        'overflow-hidden rounded-lg border border-tint-border bg-tint-panel text-tint-ink',
        className,
      )}
      {...props}
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-tint-border px-4 py-3">
        <h3 className="m-0 text-sm font-semibold">{label}</h3>
        <span className="text-xs text-tint-muted tabular-nums">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      {items.length === 0 ? (
        <p className="m-0 px-4 py-6 text-sm text-tint-muted">{emptyLabel}</p>
      ) : (
        <ol className="m-0 max-h-[32rem] list-none overflow-y-auto p-1.5">
          {items.map((item, index) => {
            const current = item.id === currentItemId
            const stateLabel = current
              ? status === 'playing'
                ? 'Playing'
                : status === 'paused'
                  ? 'Paused'
                  : status === 'ended'
                    ? 'Finished'
                    : 'Current'
              : currentIndex >= 0 && index < currentIndex
                ? 'Played'
                : 'Up next'
            const content = (
              <>
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-tint-border bg-tint-surface">
                  <QueueArtwork src={item.artwork} />
                  {current ? (
                    <span className="absolute inset-0 grid place-items-center bg-tint-ink/55 text-tint-panel">
                      <Icon icon={status === 'playing' ? Pause : Play} size="sm" />
                    </span>
                  ) : null}
                </span>

                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-tint-muted">
                    {item.subtitle ?? stateLabel}
                  </span>
                </span>

                <span className="shrink-0 text-right text-[0.6875rem] text-tint-muted tabular-nums">
                  <span
                    className={cn(
                      'block font-medium uppercase',
                      current && 'text-tint-accent',
                    )}
                  >
                    {stateLabel}
                  </span>
                  {item.durationSeconds !== undefined ? (
                    <span className="mt-0.5 block font-mono">
                      {current && positionSeconds > 0
                        ? `${formatTime(positionSeconds)} / `
                        : null}
                      {formatTime(item.durationSeconds)}
                    </span>
                  ) : null}
                </span>
              </>
            )

            return (
              <li key={item.id}>
                {onSelect ? (
                  <button
                    type="button"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => onSelect(item, index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
                      current && 'bg-tint-accent-soft',
                    )}
                  >
                    {content}
                  </button>
                ) : item.href ? (
                  <a
                    href={item.href}
                    aria-current={current ? 'true' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2 text-inherit no-underline transition-colors hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
                      current && 'bg-tint-accent-soft',
                    )}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    aria-current={current ? 'true' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2',
                      current && 'bg-tint-accent-soft',
                    )}
                  >
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function QueueArtwork({ src }: { src: string | undefined }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return src && !failed ? (
    <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
  ) : (
    <MediaPlaceholder />
  )
}
