import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { spanById } from './layout'
import { TraceMetrics } from './TraceMetrics'
import { TraceSpanDetail } from './TraceSpanDetail'
import { TraceWaterfall } from './TraceWaterfall'
import type { TraceViewerProps } from './types'

/**
 * LangSmith-style inspect layout: RED metrics, a Gantt waterfall, and the
 * selected span. The service map is a separate surface so chat demos do not
 * pull the graph engine.
 */
export function TraceViewer({
  trace,
  selectedSpanId,
  onSelectedSpanIdChange,
  className,
}: TraceViewerProps) {
  const isControlled = useRef(selectedSpanId !== undefined).current
  const [uncontrolled, setUncontrolled] = useState<string | null>(
    () => trace.spans[0]?.spanId ?? null,
  )
  const selected = isControlled ? (selectedSpanId ?? null) : uncontrolled

  const setSelected = (next: string | null) => {
    if (!isControlled) setUncontrolled(next)
    onSelectedSpanIdChange?.(next)
  }

  return (
    <div data-trace-viewer="" className={cn('grid gap-3', className)}>
      <TraceMetrics trace={trace} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
        <TraceWaterfall
          trace={trace}
          selectedSpanId={selected}
          onSelectedSpanIdChange={setSelected}
        />
        <TraceSpanDetail span={spanById(trace, selected)} />
      </div>
    </div>
  )
}
