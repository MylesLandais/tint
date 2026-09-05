import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge'
import { Surface } from '../surface'
import { cn } from '../../lib/utils'
import type { BoardCard as BoardCardModel, BoardCardKind } from './contracts'

export type BoardCardProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect' | 'title'> & {
  card: BoardCardModel
  selected?: boolean
  onSelect?: (cardId: string) => void
  /** Host override for the preview body (poster / kicker still render above). */
  children?: ReactNode
  /** Optional trailing actions (Move to…, …). */
  actions?: ReactNode
}

const KIND_LABEL: Record<BoardCardKind, string> = {
  graph: 'GRAPH',
  table: 'TABLE',
  media: 'MEDIA',
  task: 'TASK',
}

/**
 * Linear-quiet chrome for a board widget.
 *
 * Height comes from preview content so DataMasonry can pack. The live surface
 * stays in the detail pane — this card only shows a still / kicker / metrics.
 */
export function BoardCard({
  card,
  selected = false,
  onSelect,
  children,
  actions,
  className,
  ...props
}: BoardCardProps) {
  const { preview } = card

  return (
    <Surface
      as="article"
      data-tint-board-card=""
      data-kind={card.kind}
      data-selected={selected || undefined}
      elevation="sm"
      interactive={Boolean(onSelect)}
      selected={selected}
      className={cn('flex flex-col overflow-hidden text-left', onSelect && 'cursor-pointer', className)}
      onClick={onSelect ? () => onSelect(card.id) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(card.id)
              }
            }
          : undefined
      }
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      {...props}
    >
      <header className="flex items-start justify-between gap-2 border-b border-tint-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="m-0 text-[0.625rem] font-semibold tracking-[0.14em] text-tint-muted uppercase">
            {KIND_LABEL[card.kind]}
          </p>
          {/* Widget titles are labels and truncate; a task title is a sentence,
              and a lane of clipped sentences cannot be triaged. */}
          <h3
            className={cn(
              'm-0 mt-1 text-sm text-tint-ink',
              card.kind === 'task'
                ? 'font-medium break-words'
                : 'truncate font-semibold',
            )}
          >
            {card.title}
          </h3>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>

      {preview.posterUrl ? (
        <div className="aspect-video w-full overflow-hidden bg-tint-surface">
          <img
            src={preview.posterUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2 px-3 py-2.5">
        {preview.kicker ? (
          <p className="m-0 text-xs text-tint-muted">{preview.kicker}</p>
        ) : null}

        {preview.metrics && preview.metrics.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {preview.metrics.map((metric) => (
              <Badge key={metric} tone="neutral">
                {metric}
              </Badge>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </Surface>
  )
}
