import { Button } from '../button'
import { cn } from '../../lib/utils'
import type { BoardLayoutVariant } from './BoardLayout'

export type BoardLayoutToggleProps = {
  value: BoardLayoutVariant
  onChange: (variant: BoardLayoutVariant) => void
  className?: string
  disabled?: boolean
}

const OPTIONS: readonly { value: BoardLayoutVariant; label: string }[] = [
  { value: 'masonry', label: 'Masonry' },
  { value: 'kanban', label: 'Kanban' },
]

/**
 * Layout variant picker for BoardLayout.
 *
 * Switching remounts nothing about the document or selection — only placement
 * changes, the same rule FeedLayout uses for wall / list / magazine.
 */
export function BoardLayoutToggle({
  value,
  onChange,
  className,
  disabled = false,
}: BoardLayoutToggleProps) {
  return (
    <div
      data-tint-board-layout-toggle=""
      role="group"
      aria-label="Board layout"
      className={cn('flex flex-wrap gap-1', className)}
    >
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? 'primary' : 'ghost'}
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
