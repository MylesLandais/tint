import { cn } from '../../lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visual tone mapped to tint status tokens. */
  tone?: BadgeTone
  /** Optional leading content (icon). */
  leading?: ReactNode
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-tint-surface text-tint-muted border-tint-border',
  accent: 'bg-tint-accent-soft text-tint-ink border-tint-accent/30',
  success: 'bg-tint-success-soft text-tint-success-ink border-tint-success/30',
  warning: 'bg-tint-warning-soft text-tint-warning-ink border-tint-warning/30',
  danger: 'bg-tint-danger-soft text-tint-danger-ink border-tint-danger/30',
  info: 'bg-tint-info-soft text-tint-info-ink border-tint-info/30',
}

/** Compact status/label chip. Host owns the label text. */
export function Badge({
  tone = 'neutral',
  leading,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-badge=""
      data-tone={tone}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {leading}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
