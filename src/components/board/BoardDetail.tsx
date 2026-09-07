import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { BoardCard as BoardCardModel, BoardCardKind } from './contracts'

const KIND_LABEL: Record<BoardCardKind, string> = {
  graph: 'GRAPH',
  table: 'TABLE',
  media: 'MEDIA',
  task: 'TASK',
}

export type BoardDetailProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  card: BoardCardModel | null
  /** Live surface supplied by the host (graph / table / media). */
  children?: ReactNode
  empty?: ReactNode
}

/**
 * Detail pane frame: kind + title chrome around a host-supplied live surface.
 *
 * Board never imports InteractiveGraphView / DataTable / MediaPlayer — the
 * host mounts those as children so the board barrel stays light.
 */
export function BoardDetail({
  card,
  children,
  empty,
  className,
  ...props
}: BoardDetailProps) {
  if (!card) {
    return (
      <section
        data-tint-board-detail=""
        data-empty=""
        className={cn(
          'flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-tint-border bg-tint-surface px-4 py-8 text-sm text-tint-muted',
          className,
        )}
        {...props}
      >
        {empty ?? 'Select a card to open its live surface.'}
      </section>
    )
  }

  return (
    <section
      data-tint-board-detail=""
      data-kind={card.kind}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-sm',
        className,
      )}
      {...props}
    >
      <header className="flex items-center justify-between gap-2 border-b border-tint-border bg-tint-surface px-3 py-2.5">
        <div className="min-w-0">
          <p className="m-0 text-[0.625rem] font-semibold tracking-[0.14em] text-tint-muted uppercase">
            {KIND_LABEL[card.kind]}
          </p>
          <h2
            className={cn(
              'm-0 mt-0.5 text-sm font-semibold text-tint-ink',
              card.kind === 'task' ? 'break-words' : 'truncate',
            )}
          >
            {card.title}
          </h2>
        </div>
      </header>
      <div data-tint-board-detail-body="" className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </section>
  )
}
