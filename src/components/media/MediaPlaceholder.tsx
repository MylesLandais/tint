import { cn } from '../../lib/utils'

export type MediaPlaceholderProps = {
  className?: string
}

/**
 * The "white label record" fallback: a blank, unbranded vinyl glyph shown
 * whenever there is no artwork/poster, or the supplied image failed to load.
 * A flat background plus a small centered glyph — not a scaled full-bleed
 * graphic — so it drops cleanly into a square artwork slot or a wide video
 * frame alike.
 */
export function MediaPlaceholder({ className }: MediaPlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('grid size-full place-items-center bg-tint-surface', className)}
    >
      <svg viewBox="0 0 48 48" className="size-6 text-tint-border-strong" fill="none">
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="24" r="5" fill="currentColor" />
      </svg>
    </div>
  )
}
