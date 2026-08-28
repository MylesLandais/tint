import type { HTMLAttributes, ReactNode } from 'react'
import { DataMasonry, type MasonryDensity } from '../table'
import { cn } from '../../lib/utils'
import { BoardCard } from './BoardCard'
import type { BoardCard as BoardCardModel, BoardLane } from './contracts'

export type BoardLayoutVariant = 'masonry' | 'kanban'

export type BoardLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  cards: readonly BoardCardModel[]
  lanes: readonly BoardLane[]
  variant?: BoardLayoutVariant
  selectedId?: string | null
  onSelect?: (cardId: string) => void
  /** Optional per-card trailing actions. */
  renderActions?: (card: BoardCardModel) => ReactNode
  /**
   * Host override for the card body below the chrome. Defaults to the card's
   * own preview fields — use this to inject kind-specific preview chrome
   * without forking BoardCard.
   */
  renderPreview?: (card: BoardCardModel) => ReactNode
  empty?: ReactNode
  /** Forwarded to DataMasonry when `variant` is `masonry`. */
  density?: MasonryDensity
  targetWidth?: number
  gap?: number
  label?: string
}

/**
 * Presentational layout over one `BoardCard[]`.
 *
 * Two variants share the same cards so switching Masonry / Kanban never
 * remounts host selection state or invents a second document.
 *
 * - `masonry` — DataMasonry packs mixed-height cards (dynamic column engine).
 * - `kanban` — one vertical stack per lane; empty lanes still render.
 */
export function BoardLayout({
  cards,
  lanes,
  variant = 'masonry',
  selectedId = null,
  onSelect,
  renderActions,
  renderPreview,
  empty,
  density = 'auto',
  targetWidth = 320,
  gap = 12,
  label = 'Board',
  className,
  ...props
}: BoardLayoutProps) {
  if (cards.length === 0 && variant === 'masonry') {
    return (
      <div
        data-tint-board-layout=""
        data-variant={variant}
        className={cn('text-sm text-tint-muted', className)}
        {...props}
      >
        {empty ?? 'No cards on this board.'}
      </div>
    )
  }

  const renderOne = (card: BoardCardModel) => (
    <BoardCard
      card={card}
      selected={selectedId === card.id}
      onSelect={onSelect}
      actions={renderActions?.(card)}
    >
      {renderPreview?.(card)}
    </BoardCard>
  )

  if (variant === 'kanban') {
    return (
      <div
        data-tint-board-layout=""
        data-variant={variant}
        className={cn('flex gap-3 overflow-x-auto pb-1', className)}
        {...props}
      >
        {lanes.map((lane) => {
          const laneCards = cards.filter((card) => card.laneId === lane.id)
          return (
            <section
              key={lane.id}
              data-tint-board-lane=""
              data-lane-id={lane.id}
              aria-label={lane.label}
              className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-tint-border bg-tint-surface/60 p-2"
            >
              <header className="flex items-baseline justify-between gap-2 px-1 pt-1">
                <h3 className="m-0 text-xs font-semibold tracking-wide text-tint-ink uppercase">
                  {lane.label}
                </h3>
                <span className="font-mono text-[0.6875rem] tabular-nums text-tint-muted">
                  {laneCards.length}
                </span>
              </header>
              <div className="flex flex-col gap-2" role="list" aria-label={`${lane.label} cards`}>
                {laneCards.length === 0 ? (
                  <p className="m-0 rounded-lg border border-dashed border-tint-border px-3 py-6 text-center text-xs text-tint-muted">
                    Empty
                  </p>
                ) : (
                  laneCards.map((card) => (
                    <div key={card.id} role="listitem">
                      {renderOne(card)}
                    </div>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div
      data-tint-board-layout=""
      data-variant={variant}
      className={cn('min-w-0', className)}
      {...props}
    >
      <DataMasonry
        rows={cards}
        rowId="id"
        density={density}
        targetWidth={targetWidth}
        gap={gap}
        label={label}
        emptyState={empty ?? <p className="m-0 text-sm text-tint-muted">No cards on this board.</p>}
        renderItem={renderOne}
      />
    </div>
  )
}
