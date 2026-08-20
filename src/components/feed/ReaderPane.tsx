import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type ReaderPaneProps = HTMLAttributes<HTMLElement> & {
  /** Sticky header (title, source, transport). */
  header?: ReactNode
  /** Optional highlight overlay rendered above the article body. */
  highlightLayer?: ReactNode
  /** Article body. Prefer plain text / host-sanitized markup. */
  children: ReactNode
}

/**
 * Scrollable article surface with a sticky header slot and highlight layer slot.
 *
 * The highlight layer is a sibling of the body, not a child, so selection
 * toolbars can position against the scrollport without fighting article layout.
 */
export function ReaderPane({
  header,
  highlightLayer,
  children,
  className,
  ...props
}: ReaderPaneProps) {
  return (
    <article
      data-tint-reader-pane=""
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-tint-border bg-tint-panel',
        className,
      )}
      {...props}
    >
      {header ? (
        <header
          data-tint-reader-header=""
          className="sticky top-0 z-10 shrink-0 border-b border-tint-border bg-tint-panel/95 px-4 py-3 backdrop-blur"
        >
          {header}
        </header>
      ) : null}
      <div data-tint-reader-scroll="" className="relative min-h-0 flex-1 overflow-auto">
        {highlightLayer}
        <div data-tint-reader-body="" className="relative z-0 px-4 py-4 text-sm leading-7 text-tint-ink">
          {children}
        </div>
      </div>
    </article>
  )
}
