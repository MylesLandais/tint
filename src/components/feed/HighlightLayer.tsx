import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type TextHighlight = {
  id: string
  /** Inclusive start index into the plain-text body the host measured. */
  start: number
  /** Exclusive end index. */
  end: number
  /** Optional CSS color / class hint. */
  tone?: 'accent' | 'warning' | 'success'
}

export type HighlightLayerProps = HTMLAttributes<HTMLDivElement> & {
  /** Full plain-text body the spans were measured against. */
  text: string
  highlights: readonly TextHighlight[]
  activeId?: string | null
  onHighlightClick?: (id: string) => void
}

const TONE_CLASS = {
  accent: 'bg-tint-accent/25',
  warning: 'bg-tint-warning/30',
  success: 'bg-tint-success/25',
} as const

/**
 * Renders precomputed highlight spans over plain text.
 *
 * Hosts compute `{start,end}` offline (or from selection). This layer never
 * mutates the document — it only paints — so Ghostreader-style persistence
 * stays out of the component.
 */
export function HighlightLayer({
  text,
  highlights,
  activeId = null,
  onHighlightClick,
  className,
  ...props
}: HighlightLayerProps) {
  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  const pieces: { key: string; content: string; highlight?: TextHighlight }[] = []
  let cursor = 0

  for (const highlight of sorted) {
    const start = Math.max(0, Math.min(text.length, highlight.start))
    const end = Math.max(start, Math.min(text.length, highlight.end))
    if (start > cursor) {
      pieces.push({ key: `t-${cursor}`, content: text.slice(cursor, start) })
    }
    pieces.push({
      key: highlight.id,
      content: text.slice(start, end),
      highlight,
    })
    cursor = end
  }
  if (cursor < text.length) {
    pieces.push({ key: `t-${cursor}`, content: text.slice(cursor) })
  }

  return (
    <div
      data-tint-highlight-layer=""
      aria-hidden={!onHighlightClick}
      className={cn(
        'pointer-events-none absolute inset-0 z-[1] whitespace-pre-wrap px-4 py-4 text-sm leading-7 text-transparent',
        className,
      )}
      {...props}
    >
      {pieces.map((piece) =>
        piece.highlight ? (
          <mark
            key={piece.key}
            data-tint-highlight={piece.highlight.id}
            data-active={activeId === piece.highlight.id || undefined}
            className={cn(
              'pointer-events-auto rounded-sm text-transparent',
              TONE_CLASS[piece.highlight.tone ?? 'accent'],
              activeId === piece.highlight.id && 'ring-1 ring-tint-accent',
            )}
            onClick={
              onHighlightClick
                ? (event) => {
                    event.preventDefault()
                    onHighlightClick(piece.highlight!.id)
                  }
                : undefined
            }
          >
            {piece.content}
          </mark>
        ) : (
          <span key={piece.key}>{piece.content}</span>
        ),
      )}
    </div>
  )
}
