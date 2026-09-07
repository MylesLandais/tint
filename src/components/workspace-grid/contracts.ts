export type WorkspaceBreakpoint = string
export type WorkspaceCollisionMode = 'compact' | 'prevent' | 'free'

export type WorkspaceItem = { id: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number; static?: boolean }
export type WorkspaceDocument = { id: string; revision: string; layouts: Readonly<Record<WorkspaceBreakpoint, readonly WorkspaceItem[]>>; metadata?: Readonly<Record<string, unknown>> }
export type WorkspaceCommand =
  | { type: 'move'; breakpoint: WorkspaceBreakpoint; itemId: string; x: number; y: number; baseRevision?: string }
  | { type: 'resize'; breakpoint: WorkspaceBreakpoint; itemId: string; w: number; h: number; baseRevision?: string }
  | { type: 'reorder'; breakpoint: WorkspaceBreakpoint; itemId: string; beforeId?: string; baseRevision?: string }
  | { type: 'replace-layouts'; layouts: WorkspaceDocument['layouts']; baseRevision?: string }

function nextRevision(revision: string): string {
  const numeric = Number.parseInt(revision, 10)
  return Number.isFinite(numeric) ? String(numeric + 1) : `${revision}:1`
}
function clamp(value: number, min: number, max?: number): number { return Math.max(min, max == null ? value : Math.min(max, value)) }
function collides(a: WorkspaceItem, b: WorkspaceItem): boolean { return a.id !== b.id && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y }

export function applyWorkspaceCommand(
  document: WorkspaceDocument,
  command: WorkspaceCommand,
  options: { collisionMode?: WorkspaceCollisionMode; columns?: Readonly<Record<string, number>> } = {},
): WorkspaceDocument {
  if (command.baseRevision && command.baseRevision !== document.revision) return document
  if (command.type === 'replace-layouts') return { ...document, revision: nextRevision(document.revision), layouts: command.layouts }
  const current = document.layouts[command.breakpoint] ?? []
  const index = current.findIndex((item) => item.id === command.itemId)
  if (index < 0) return document
  if (command.type === 'reorder') {
    const reordered = [...current]
    const [item] = reordered.splice(index, 1)
    if (!item) return document
    const before = command.beforeId ? reordered.findIndex((entry) => entry.id === command.beforeId) : -1
    reordered.splice(before < 0 ? reordered.length : before, 0, item)
    return { ...document, revision: nextRevision(document.revision), layouts: { ...document.layouts, [command.breakpoint]: reordered } }
  }
  const original = current[index]!
  const columns = options.columns?.[command.breakpoint]
  const candidate: WorkspaceItem = command.type === 'move'
    ? { ...original, x: clamp(Math.round(command.x), 0, columns == null ? undefined : Math.max(0, columns - original.w)), y: clamp(Math.round(command.y), 0) }
    : { ...original, w: clamp(Math.round(command.w), original.minW ?? 1, original.maxW ?? columns), h: clamp(Math.round(command.h), original.minH ?? 1, original.maxH) }
  if (options.collisionMode === 'prevent' && current.some((item) => collides(candidate, item))) return document
  const layout = current.map((item, itemIndex) => itemIndex === index ? candidate : item)
  return { ...document, revision: nextRevision(document.revision), layouts: { ...document.layouts, [command.breakpoint]: layout } }
}
