import { Button } from '../button'
import { cn } from '../../lib/utils'
import type { FeedLayoutVariant } from './FeedLayout'

export type ViewModeToggleProps = {
  value: FeedLayoutVariant
  onChange: (variant: FeedLayoutVariant) => void
  /** Subset of variants to offer. Defaults to all six. */
  options?: readonly FeedLayoutVariant[]
  className?: string
  disabled?: boolean
}

const DEFAULT_OPTIONS: readonly FeedLayoutVariant[] = [
  'feed',
  'list',
  'magazine',
  'wall',
  'carousel',
  'ticker',
]

const LABELS: Record<FeedLayoutVariant, string> = {
  feed: 'Feed',
  list: 'List',
  magazine: 'Magazine',
  wall: 'Wall',
  carousel: 'Carousel',
  ticker: 'Ticker',
}

/**
 * Layout variant picker for FeedLayout.
 *
 * Feedly-style density maps onto `FeedLayout.variant` rather than a second
 * density prop, so hosts never fork "magazine vs cards" into parallel trees.
 */
export function ViewModeToggle({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
  disabled = false,
}: ViewModeToggleProps) {
  return (
    <div
      data-tint-view-mode-toggle=""
      role="group"
      aria-label="Feed layout"
      className={cn('flex flex-wrap gap-1', className)}
    >
      {options.map((variant) => (
        <Button
          key={variant}
          size="sm"
          variant={value === variant ? 'primary' : 'ghost'}
          aria-pressed={value === variant}
          disabled={disabled}
          onClick={() => onChange(variant)}
        >
          {LABELS[variant]}
        </Button>
      ))}
    </div>
  )
}
