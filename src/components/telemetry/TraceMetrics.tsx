import { Activity, AlertTriangle, Clock3 } from 'lucide-react'
import { Icon } from '../icon'
import { MetricCard } from '../charts'
import { cn } from '../../lib/utils'
import { formatDuration } from './layout'
import { deriveTraceMetrics } from './metrics'
import type { TraceMetricsProps } from './types'

export function TraceMetrics({ trace, className }: TraceMetricsProps) {
  const metrics = deriveTraceMetrics(trace)

  const cards = [
    {
      key: 'rate',
      label: 'Spans',
      value: String(metrics.spanCount),
      hint: `${metrics.services.length} service${metrics.services.length === 1 ? '' : 's'}`,
      icon: Activity,
    },
    {
      key: 'errors',
      label: 'Errors',
      value: String(metrics.errorCount),
      hint: metrics.errorCount === 0 ? 'No failed spans' : 'Failed spans in this trace',
      icon: AlertTriangle,
      danger: metrics.errorCount > 0,
    },
    {
      key: 'duration',
      label: 'Duration',
      value: formatDuration(metrics.durationMs),
      hint: `p50 ${formatDuration(metrics.p50Ms)} · p95 ${formatDuration(metrics.p95Ms)}`,
      icon: Clock3,
    },
  ] as const

  return (
    <div
      data-trace-metrics=""
      className={cn('grid gap-2 sm:grid-cols-3', className)}
    >
      {cards.map((card) => (
        <MetricCard
          key={card.key}
          label={card.label}
          value={card.value}
          hint={card.hint}
          icon={<Icon icon={card.icon} size="sm" />}
          tone={'danger' in card && card.danger ? 'danger' : 'default'}
          className={cn(
            'danger' in card && card.danger && 'border-tint-danger/40 bg-tint-danger-soft',
          )}
        />
      ))}
    </div>
  )
}
