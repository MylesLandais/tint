/*
 * Dataset-editor interaction model: cell cursor and range, keyboard
 * navigation, the edit-session state machine, and clipboard (TSV) mapping.
 * Everything is pure and index-based so any renderer can drive it; the grid
 * resolves indices to rows/columns of the current view.
 */
import { cellIssue, draftFromValue, type CellIssue } from './fieldValues'
import type { TableFieldType } from './fieldTypes'

export type CellAddress = { row: number; col: number }
/** `anchor` is the active cell (as in Excel); `focus` is the moving corner. */
export type CellSelection = { anchor: CellAddress; focus: CellAddress }
export type GridDims = { rows: number; cols: number }

export const cellSelection = (row: number, col: number): CellSelection => ({
  anchor: { row, col },
  focus: { row, col },
})

export const sameCell = (a: CellAddress, b: CellAddress) => a.row === b.row && a.col === b.col

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))

export function normalizeRange(sel: CellSelection) {
  return {
    top: Math.min(sel.anchor.row, sel.focus.row),
    bottom: Math.max(sel.anchor.row, sel.focus.row),
    left: Math.min(sel.anchor.col, sel.focus.col),
    right: Math.max(sel.anchor.col, sel.focus.col),
  }
}

export function isCellInSelection(sel: CellSelection | null, cell: CellAddress): boolean {
  if (!sel) return false
  const r = normalizeRange(sel)
  return cell.row >= r.top && cell.row <= r.bottom && cell.col >= r.left && cell.col <= r.right
}

export function rangeCells(sel: CellSelection): CellAddress[] {
  const r = normalizeRange(sel)
  const cells: CellAddress[] = []
  for (let row = r.top; row <= r.bottom; row++)
    for (let col = r.left; col <= r.right; col++) cells.push({ row, col })
  return cells
}

export type NavigationKey =
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'Tab' | 'Enter' | 'Home' | 'End' | 'PageUp' | 'PageDown'

export type NavigationModifiers = { shift?: boolean; mod?: boolean; pageSize?: number }

/**
 * Next selection for a navigation key. Tab/Enter wrap to the next/previous
 * row; shift extends the range from the anchor (arrows) or reverses (Tab/Enter);
 * mod jumps to the grid edge.
 */
export function navigateCells(
  sel: CellSelection,
  key: NavigationKey,
  dims: GridDims,
  { shift = false, mod = false, pageSize = 10 }: NavigationModifiers = {},
): CellSelection {
  if (dims.rows === 0 || dims.cols === 0) return sel
  const lastRow = dims.rows - 1
  const lastCol = dims.cols - 1
  const from = shift && !['Tab', 'Enter'].includes(key) ? sel.focus : sel.anchor
  let { row, col } = from

  switch (key) {
    case 'ArrowUp': row = mod ? 0 : row - 1; break
    case 'ArrowDown': row = mod ? lastRow : row + 1; break
    case 'ArrowLeft': col = mod ? 0 : col - 1; break
    case 'ArrowRight': col = mod ? lastCol : col + 1; break
    case 'Home': col = 0; if (mod) row = 0; break
    case 'End': col = lastCol; if (mod) row = lastRow; break
    case 'PageUp': row -= pageSize; break
    case 'PageDown': row += pageSize; break
    case 'Tab': {
      const step = shift ? -1 : 1
      col += step
      if (col > lastCol) { col = 0; row += 1 } else if (col < 0) { col = lastCol; row -= 1 }
      break
    }
    case 'Enter': row += shift ? -1 : 1; break
  }

  const next = { row: clamp(row, lastRow), col: clamp(col, lastCol) }
  const extend = shift && !['Tab', 'Enter'].includes(key)
  return extend ? { anchor: sel.anchor, focus: next } : { anchor: next, focus: next }
}

// ---------------------------------------------------------------------------
// Edit session
// ---------------------------------------------------------------------------

export type EditSession =
  | { phase: 'idle' }
  | {
      phase: 'editing' | 'committing'
      cell: CellAddress
      type: TableFieldType | undefined
      original: string
      draft: string
      issue: CellIssue | null
    }
  | { phase: 'error'; cell: CellAddress; type: TableFieldType | undefined; original: string; draft: string; issue: CellIssue }

export type EditEvent =
  /** `seed` replaces the draft (typing over a selected cell); otherwise the current value is kept. */
  | { type: 'begin'; cell: CellAddress; fieldType: TableFieldType | undefined; value: unknown; seed?: string }
  | { type: 'input'; draft: string }
  | { type: 'commit' }
  | { type: 'committed' }
  | { type: 'failed'; message: string }
  | { type: 'cancel' }

export const IDLE: EditSession = { phase: 'idle' }

export function editReducer(state: EditSession, event: EditEvent): EditSession {
  switch (event.type) {
    case 'begin': {
      const original = draftFromValue(event.fieldType, event.value)
      const draft = event.seed ?? original
      return {
        phase: 'editing',
        cell: event.cell,
        type: event.fieldType,
        original,
        draft,
        issue: cellIssue(event.fieldType, draft),
      }
    }
    case 'input':
      if (state.phase !== 'editing' && state.phase !== 'error') return state
      return { phase: 'editing', cell: state.cell, type: state.type, original: state.original, draft: event.draft, issue: cellIssue(state.type, event.draft) }
    case 'commit':
      // A hard (invalid) issue blocks commit; a warning does not.
      if (state.phase !== 'editing') return state
      if (state.issue?.state === 'invalid') {
        return { phase: 'error', cell: state.cell, type: state.type, original: state.original, draft: state.draft, issue: state.issue }
      }
      return { ...state, phase: 'committing' }
    case 'committed':
      return state.phase === 'committing' ? IDLE : state
    case 'failed':
      if (state.phase !== 'committing') return state
      return { phase: 'error', cell: state.cell, type: state.type, original: state.original, draft: state.draft, issue: { state: 'invalid', message: event.message } }
    case 'cancel':
      return IDLE
  }
}

/** A commit with an unchanged draft needs no write. */
export const isDirty = (s: EditSession) => s.phase !== 'idle' && s.draft !== s.original

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

const needsQuote = /[\t\n\r"]/

export function toTsv(matrix: readonly (readonly string[])[]): string {
  return matrix
    .map((row) => row.map((v) => (needsQuote.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join('\t'))
    .join('\n')
}

/** Parses spreadsheet clipboard text, honouring quoted cells with tabs/newlines. */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/\r\n?/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === '\t') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

export type PasteWrite = CellAddress & { draft: string }

/**
 * Maps clipboard cells onto the grid. A single value fills the whole selected
 * range (Excel behaviour); otherwise the block is anchored at the active cell
 * and clipped to the grid.
 */
export function planPaste(sel: CellSelection, matrix: readonly (readonly string[])[], dims: GridDims): PasteWrite[] {
  if (matrix.length === 0) return []
  if (matrix.length === 1 && matrix[0].length === 1) {
    return rangeCells(sel).map((c) => ({ ...c, draft: matrix[0][0] }))
  }
  const r = normalizeRange(sel)
  const writes: PasteWrite[] = []
  matrix.forEach((cells, dr) =>
    cells.forEach((draft, dc) => {
      const row = r.top + dr
      const col = r.left + dc
      if (row < dims.rows && col < dims.cols) writes.push({ row, col, draft })
    }),
  )
  return writes
}

/** Ctrl+D: copy the top row of the range down through the rest of it. */
export function planFillDown(sel: CellSelection): { from: CellAddress; to: CellAddress }[] {
  const r = normalizeRange(sel)
  const fills: { from: CellAddress; to: CellAddress }[] = []
  for (let row = r.top + 1; row <= r.bottom; row++)
    for (let col = r.left; col <= r.right; col++) fills.push({ from: { row: r.top, col }, to: { row, col } })
  return fills
}

// ---------------------------------------------------------------------------
// Pointer interaction (Notion / Airtable click model)
// ---------------------------------------------------------------------------

export type ClickAction = 'select' | 'edit' | 'popover' | 'toggle' | 'rate'

const PICKER_TYPES: ReadonlySet<string> = new Set(['select', 'multi-select', 'linked-record'])

export const isPickerType = (type: TableFieldType | undefined): boolean => PICKER_TYPES.has(type ?? 'text')

/**
 * What a click on a cell does. A first click only selects, so the cell can be
 * the target of a drag or a range; clicking the already-active cell again
 * opens its editor. Checkbox and rating respond to the first click because
 * there is nothing to "enter" — the click is the edit.
 */
export function cellClickAction(
  previous: CellSelection | null,
  cell: CellAddress,
  type: TableFieldType | undefined,
  { readOnly = false, extend = false }: { readOnly?: boolean; extend?: boolean } = {},
): ClickAction {
  if (readOnly || extend) return 'select'
  if (type === 'checkbox') return 'toggle'
  if (type === 'rating') return 'rate'
  const wasActive =
    previous != null && sameCell(previous.anchor, cell) && sameCell(previous.focus, cell)
  if (!wasActive) return 'select'
  return isPickerType(type) ? 'popover' : 'edit'
}

/** Clicking star N sets N; clicking the current rating clears it, as in Airtable. */
export const ratingFromPointer = (star: number, current: unknown): number | null =>
  Number(current) === star ? null : star
