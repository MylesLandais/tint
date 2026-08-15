import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Progress in the range 0–100. */
  value: number
  /** Accessible name when no visible label is adjacent. */
  label?: string
  /** Show the numeric percent beside the track. */
  showValue?: boolean
}

/** Non-interactive determinate progress track. */
export function ProgressBar({
  value,
  label,
  showValue = false,
  className,
  ...props
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

  return (
    <div
      data-progress-bar=""
      className={cn('flex min-w-0 items-center gap-2', className)}
      {...props}
    >
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-tint-surface"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="block h-full rounded-full bg-tint-accent transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-tint-muted">
          {Math.round(clamped)}%
        </span>
      ) : null}
    </div>
  )
}
