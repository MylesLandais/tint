import { Activity, AlertTriangle, Clock3 } from 'lucide-react'
import { Icon } from '../icon'
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
        <article
          key={card.key}
          className={cn(
            'rounded-xl border border-tint-border bg-tint-panel px-3 py-2.5',
            'danger' in card && card.danger && 'border-tint-danger/40 bg-tint-danger-soft',
          )}
        >
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-wide text-tint-muted uppercase">
            <Icon icon={card.icon} size="sm" />
            {card.label}
          </p>
          <p
            className={cn(
              'mt-1 text-lg font-semibold text-tint-ink',
              'danger' in card && card.danger && 'text-tint-danger-ink',
            )}
          >
            {card.value}
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-tint-muted">{card.hint}</p>
        </article>
      ))}
    </div>
  )
}
