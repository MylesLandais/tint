import { useCallback, useMemo, useRef } from 'react'
import { emptySelection, InteractiveGraphView, type GraphSelection } from '../graph'
import { cn } from '../../lib/utils'
import { graphDocumentFromTrace, runtimeByService } from './serviceMap'
import type { TraceServiceMapProps } from './types'

/**
 * Service topology for a trace, drawn with the public graph canvas.
 *
 * xyflow stays behind `tint/graph`. Hosts that render this must import
 * `tint/graph/styles.css` themselves — the same rule as InteractiveGraphView.
 */
export function TraceServiceMap({
  trace,
  selectedService,
  onSelectedServiceChange,
  className,
}: TraceServiceMapProps) {
  const isControlled = useRef(selectedService !== undefined).current
  const document = useMemo(() => graphDocumentFromTrace(trace), [trace])
  const runtimeByNodeId = useMemo(() => runtimeByService(trace), [trace])
  const selection = useMemo<GraphSelection>(() => {
    if (!selectedService) return emptySelection()
    return {
      nodeIds: new Set([selectedService]),
      edgeIds: new Set(),
      groupIds: new Set(),
      primary: { kind: 'node', id: selectedService },
    }
  }, [selectedService])

  const onSelectionChange = useCallback(
    (next: GraphSelection) => {
      const id = next.primary?.kind === 'node' ? next.primary.id : [...next.nodeIds][0]
      onSelectedServiceChange?.(id ?? null)
    },
    [onSelectedServiceChange],
  )

  return (
    <div
      data-trace-service-map=""
      className={cn('h-[28rem] overflow-hidden rounded-xl border border-tint-border', className)}
    >
      <InteractiveGraphView
        document={document}
        readonly
        selection={isControlled ? selection : undefined}
        runtimeByNodeId={runtimeByNodeId}
        showInspector
        showFullscreenControl={false}
        onSelectionChange={onSelectionChange}
        className="h-full min-h-0"
      />
    </div>
  )
}
