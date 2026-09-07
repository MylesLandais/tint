import { Responsive, getCompactor, type Layout, type ResponsiveLayouts } from 'react-grid-layout'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { WorkspaceCollisionMode, WorkspaceItem } from './contracts'

export type WorkspaceEngineProps = {
  layouts: Readonly<Record<string, readonly WorkspaceItem[]>>; breakpoints: Readonly<Record<string, number>>; columns: Readonly<Record<string, number>>
  rowHeight: number; margin: readonly [number, number]; collisionMode: WorkspaceCollisionMode; disabled: boolean; children: ReactNode
  onBreakpointChange(breakpoint: string): void; onLayoutsChange(layouts: Readonly<Record<string, readonly WorkspaceItem[]>>): void
}

function toEngineLayouts(layouts: WorkspaceEngineProps['layouts']): ResponsiveLayouts<string> {
  return Object.fromEntries(Object.entries(layouts).map(([key, items]) => [key, items.map((item) => ({ ...item, i: item.id }))]))
}
function fromEngineLayouts(layouts: ResponsiveLayouts<string>): Readonly<Record<string, readonly WorkspaceItem[]>> {
  return Object.fromEntries(Object.entries(layouts).map(([key, items]) => [key, (items ?? []).map(({ i, x, y, w, h, minW, minH, maxW, maxH, static: fixed }) => ({ id: i, x, y, w, h, minW, minH, maxW, maxH, static: fixed }))]))
}

export function WorkspaceEngine({ layouts, breakpoints, columns, rowHeight, margin, collisionMode, disabled, children, onBreakpointChange, onLayoutsChange }: WorkspaceEngineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(Math.max(1, element.getBoundingClientRect().width))
    update()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(element)
    return () => observer?.disconnect()
  }, [])
  const compactor = getCompactor(collisionMode === 'compact' ? 'vertical' : null, collisionMode === 'free', collisionMode === 'prevent')
  return (
    <div ref={ref} className="min-w-0">
      <Responsive<string>
        width={width} layouts={toEngineLayouts(layouts)} breakpoints={{ ...breakpoints }} cols={{ ...columns }} rowHeight={rowHeight} margin={margin}
        compactor={compactor} dragConfig={{ enabled: !disabled }} resizeConfig={{ enabled: !disabled, handles: ['se'] }}
        onBreakpointChange={(next) => onBreakpointChange(next)}
        onLayoutChange={(_layout: Layout, next) => onLayoutsChange(fromEngineLayouts(next))}
      >
        {children}
      </Responsive>
    </div>
  )
}
