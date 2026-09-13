import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

export type ChatMessageAlternativesProps = {
  /** Stable source indices. Missing/null source slots should be omitted. */
  alternatives: readonly { id: string; label?: string }[]
  value: string
  onValueChange: (id: string) => void
  /** Request a new alternative from the host. Omit to hide the control. */
  onRegenerate?: () => void
  disabled?: boolean
  label?: string
  className?: string
}

/** Controlled navigation through saved message versions; never generates text. */
export function ChatMessageAlternatives({ alternatives, value, onValueChange, onRegenerate,
  disabled = false, label = 'Saved responses', className }: ChatMessageAlternativesProps) {
  const index = alternatives.findIndex((item) => item.id === value)
  const button = 'rounded p-1 text-tint-muted hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent disabled:opacity-40'
  return (
    <div role="group" aria-label={label} className={cn('inline-flex min-w-0 items-center gap-1 text-xs', className)}>
      <button type="button" className={button} aria-label="Previous saved response"
        disabled={disabled || index <= 0} onClick={() => onValueChange(alternatives[index - 1].id)}>
        <Icon icon={ChevronLeft} size="sm" />
      </button>
      <span role="status" aria-live="polite" className="tabular-nums text-tint-muted">
        {index < 0 ? '—' : index + 1} / {alternatives.length}
        {index >= 0 && alternatives[index].label ? ` · ${alternatives[index].label}` : ''}
      </span>
      <button type="button" className={button} aria-label="Next saved response"
        disabled={disabled || index < 0 || index >= alternatives.length - 1}
        onClick={() => onValueChange(alternatives[index + 1].id)}>
        <Icon icon={ChevronRight} size="sm" />
      </button>
      {onRegenerate ? <button type="button" className={button} disabled={disabled}
        aria-label="Generate another response" onClick={onRegenerate}>
        <Icon icon={RotateCcw} size="sm" />
      </button> : null}
    </div>
  )
}
