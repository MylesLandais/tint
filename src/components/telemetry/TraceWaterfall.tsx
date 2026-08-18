import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import { formatDuration, layoutTrace, serviceColor } from './layout'
import type { LaidOutSpan } from './layout'
import type { TraceWaterfallProps } from './types'

function selectSpan(
  current: string | null | undefined,
  next: string,
  onChange?: (spanId: string | null) => void,
) {
  onChange?.(current === next ? null : next)
}

function SpanBar({
  span,
  selected,
}: {
  span: LaidOutSpan
  selected: boolean
}) {
  const color = span.status === 'error' ? 'var(--tint-danger)' : serviceColor(span.service)
  return (
    <span
      data-trace-bar=""
      data-status={span.status}
      className={cn(
        'absolute top-1/2 h-3.5 -translate-y-1/2 rounded-sm',
        selected && 'ring-2 ring-tint-accent ring-offset-1 ring-offset-tint-panel',
      )}
      style={{
        left: `${span.offsetRatio * 100}%`,
        width: `${span.widthRatio * 100}%`,
        background: color,
      }}
    />
  )
}

export function TraceWaterfall({
  trace,
  selectedSpanId,
  onSelectedSpanIdChange,
  className,
}: TraceWaterfallProps) {
  const layout = useMemo(() => layoutTrace(trace), [trace])

  return (
    <div
      data-trace-waterfall=""
      className={cn('overflow-hidden rounded-xl border border-tint-border bg-tint-panel', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-tint-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-tint-ink">{trace.name}</p>
          <p className="truncate font-mono text-[0.6875rem] text-tint-muted">{trace.traceId}</p>
        </div>
        <p className="shrink-0 text-xs text-tint-muted">{formatDuration(layout.durationMs)}</p>
      </div>

      <div
        className="relative h-8 border-b border-tint-border bg-tint-surface"
        aria-hidden="true"
      >
        {layout.spans.map((span) => (
          <span
            key={`mini-${span.spanId}`}
            className="absolute top-2 h-4 rounded-sm opacity-80"
            style={{
              left: `${span.offsetRatio * 100}%`,
              width: `${span.widthRatio * 100}%`,
              background:
                span.status === 'error' ? 'var(--tint-danger)' : serviceColor(span.service),
            }}
          />
        ))}
      </div>

      {layout.spans.length === 0 ? (
        <p className="px-3 py-6 text-sm text-tint-muted">No spans in this trace.</p>
      ) : (
        <div role="listbox" aria-label="Trace waterfall" className="max-h-[22rem] overflow-auto">
          {layout.spans.map((span) => {
            const selected = selectedSpanId === span.spanId
            return (
              <button
                key={span.spanId}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectSpan(selectedSpanId, span.spanId, onSelectedSpanIdChange)}
                className={cn(
                  'grid w-full grid-cols-[minmax(11rem,32%)_1fr] items-stretch text-left outline-none',
                  'hover:bg-tint-accent-soft/60 focus-visible:bg-tint-accent-soft',
                  selected && 'bg-tint-accent-soft',
                )}
              >
                <span
                  className="flex min-w-0 flex-col justify-center border-r border-tint-border py-1.5 pr-2"
                  style={{ paddingLeft: `${0.75 + span.depth * 0.75}rem` }}
                >
                  <span className="truncate text-xs font-medium text-tint-ink">{span.name}</span>
                  <span className="truncate font-mono text-[0.625rem] text-tint-muted">
                    {span.service}
                    <span className="text-tint-border-strong"> · </span>
                    {formatDuration(span.durationMs)}
                  </span>
                </span>
                <span className="relative min-h-9 min-w-0">
                  <SpanBar span={span} selected={selected} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-between border-t border-tint-border px-3 py-1 font-mono text-[0.625rem] text-tint-muted">
        <span>0ms</span>
        <span>{formatDuration(layout.durationMs)}</span>
      </div>
    </div>
  )
}
