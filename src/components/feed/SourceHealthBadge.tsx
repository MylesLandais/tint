import { Badge, type BadgeTone } from '../badge'
import type { SourceHealth } from './contracts'

export type SourceHealthBadgeProps = {
  health: SourceHealth
  className?: string
}

const TONE: Record<SourceHealth, BadgeTone> = {
  healthy: 'success',
  dormant: 'neutral',
  inactive: 'warning',
  unreachable: 'danger',
}

const LABEL: Record<SourceHealth, string> = {
  healthy: 'healthy',
  dormant: 'dormant',
  inactive: 'inactive',
  unreachable: 'unreachable',
}

/** Crawl health chip. Maps host SourceHealth onto Badge tones. */
export function SourceHealthBadge({ health, className }: SourceHealthBadgeProps) {
  return (
    <Badge tone={TONE[health]} className={className} data-tint-source-health={health}>
      {LABEL[health]}
    </Badge>
  )
}
