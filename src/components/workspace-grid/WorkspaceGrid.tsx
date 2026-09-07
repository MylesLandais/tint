import { useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { applyWorkspaceCommand, type WorkspaceCollisionMode, type WorkspaceCommand, type WorkspaceDocument, type WorkspaceItem } from './contracts'
import { WorkspaceEngine } from './rglAdapter'

export type WorkspaceGridProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> & {
  document: WorkspaceDocument; breakpoints?: Readonly<Record<string, number>>; columns?: Readonly<Record<string, number>>; rowHeight?: number
  margin?: readonly [number, number]; collisionMode?: WorkspaceCollisionMode; disabled?: boolean
  renderItem(item: WorkspaceItem, breakpoint: string): ReactNode
  onDocumentChange(document: WorkspaceDocument, command: WorkspaceCommand): void
}
const DEFAULT_BREAKPOINTS = { lg: 1200, md: 768, sm: 0 }
const DEFAULT_COLUMNS = { lg: 12, md: 8, sm: 4 }

function layoutsEqual(left: WorkspaceDocument['layouts'], right: WorkspaceDocument['layouts']): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length || leftKeys.some((key) => !rightKeys.includes(key))) return false
  return leftKeys.every((key) => {
    const a = left[key] ?? []
    const b = right[key] ?? []
    return a.length === b.length && a.every((item, index) => {
      const other = b[index]
      return other != null && item.id === other.id && item.x === other.x && item.y === other.y && item.w === other.w && item.h === other.h
        && item.minW === other.minW && item.minH === other.minH && item.maxW === other.maxW && item.maxH === other.maxH && item.static === other.static
    })
  })
}

export function WorkspaceGrid({
  document, breakpoints = DEFAULT_BREAKPOINTS, columns = DEFAULT_COLUMNS, rowHeight = 48, margin = [12, 12], collisionMode = 'compact', disabled = false,
  renderItem, onDocumentChange, className, ...props
}: WorkspaceGridProps) {
  const [breakpoint, setBreakpoint] = useState(Object.keys(breakpoints)[0] ?? 'lg')
  const items = document.layouts[breakpoint] ?? document.layouts[Object.keys(document.layouts)[0] ?? ''] ?? []
  const issue = (command: WorkspaceCommand) => {
    if (command.type === 'replace-layouts' && layoutsEqual(document.layouts, command.layouts)) return
    const next = applyWorkspaceCommand(document, command, { collisionMode, columns })
    if (next !== document) onDocumentChange(next, command)
  }
  const keyboard = (event: KeyboardEvent, item: WorkspaceItem) => {
    if (disabled || item.static || !event.altKey) return
    const delta = event.shiftKey ? 2 : 1
    let command: WorkspaceCommand | null = null
    if (event.key === 'ArrowLeft') command = event.ctrlKey ? { type: 'resize', breakpoint, itemId: item.id, w: item.w - delta, h: item.h, baseRevision: document.revision } : { type: 'move', breakpoint, itemId: item.id, x: item.x - delta, y: item.y, baseRevision: document.revision }
    if (event.key === 'ArrowRight') command = event.ctrlKey ? { type: 'resize', breakpoint, itemId: item.id, w: item.w + delta, h: item.h, baseRevision: document.revision } : { type: 'move', breakpoint, itemId: item.id, x: item.x + delta, y: item.y, baseRevision: document.revision }
    if (event.key === 'ArrowUp') command = event.ctrlKey ? { type: 'resize', breakpoint, itemId: item.id, w: item.w, h: item.h - delta, baseRevision: document.revision } : { type: 'move', breakpoint, itemId: item.id, x: item.x, y: item.y - delta, baseRevision: document.revision }
    if (event.key === 'ArrowDown') command = event.ctrlKey ? { type: 'resize', breakpoint, itemId: item.id, w: item.w, h: item.h + delta, baseRevision: document.revision } : { type: 'move', breakpoint, itemId: item.id, x: item.x, y: item.y + delta, baseRevision: document.revision }
    if (command) { event.preventDefault(); issue(command) }
  }
  return (
    <div data-tint-workspace-grid="" data-breakpoint={breakpoint} className={cn('min-w-0', className)} {...props}>
      <p className="sr-only">Use Alt plus arrow keys to move a focused item. Add Control to resize; add Shift for larger steps.</p>
      <WorkspaceEngine
        layouts={document.layouts} breakpoints={breakpoints} columns={columns} rowHeight={rowHeight} margin={margin} collisionMode={collisionMode} disabled={disabled}
        onBreakpointChange={setBreakpoint}
        onLayoutsChange={(layouts) => issue({ type: 'replace-layouts', layouts, baseRevision: document.revision })}
      >
        {items.map((item) => (
          <div key={item.id} role="button" tabIndex={disabled || item.static ? undefined : 0} aria-label={`Workspace item ${item.id}`} onKeyDown={(event) => keyboard(event, item)} className="overflow-auto rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent">
            {renderItem(item, breakpoint)}
          </div>
        ))}
      </WorkspaceEngine>
    </div>
  )
}
