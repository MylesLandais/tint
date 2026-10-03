/*
 * Undo/redo for dataset edits. Entries hold invertible operations; the host
 * applies the returned ops to its rows/fields, so history stays independent of
 * where the data lives (local state, adapter, server).
 */
import type { TableRowId } from './types'
import { emptyFieldValue } from './fieldValues'
import type { FieldDef } from './schema'

export type DatasetOp<TRow = Record<string, unknown>> =
  | { kind: 'cell'; rowId: TableRowId; field: string; before: unknown; after: unknown }
  | { kind: 'insert-row'; row: TRow; index: number }
  | { kind: 'remove-row'; row: TRow; index: number }
  | { kind: 'schema'; before: readonly FieldDef[]; after: readonly FieldDef[] }

export type HistoryEntry<TRow = Record<string, unknown>> = { label: string; ops: readonly DatasetOp<TRow>[] }

export type EditHistory<TRow = Record<string, unknown>> = {
  past: readonly HistoryEntry<TRow>[]
  future: readonly HistoryEntry<TRow>[]
}

const sameValue = (a: unknown, b: unknown) => Object.is(a, b) || (Array.isArray(a) && Array.isArray(b) && JSON.stringify(a) === JSON.stringify(b))

export const HISTORY_LIMIT = 200

export const emptyEditHistory = <TRow = Record<string, unknown>>(): EditHistory<TRow> => ({ past: [], future: [] })

export function invertOp<TRow>(op: DatasetOp<TRow>): DatasetOp<TRow> {
  switch (op.kind) {
    case 'cell': return { ...op, before: op.after, after: op.before }
    case 'insert-row': return { kind: 'remove-row', row: op.row, index: op.index }
    case 'remove-row': return { kind: 'insert-row', row: op.row, index: op.index }
    case 'schema': return { kind: 'schema', before: op.after, after: op.before }
  }
}

/** Record a user action. A new action discards the redo branch. No-op cell edits are dropped. */
export function recordEdit<TRow>(history: EditHistory<TRow>, entry: HistoryEntry<TRow>): EditHistory<TRow> {
  const ops = entry.ops.filter((op) => op.kind !== 'cell' || !sameValue(op.before, op.after))
  if (ops.length === 0) return history
  const past = [...history.past, { ...entry, ops }]
  return { past: past.slice(-HISTORY_LIMIT), future: [] }
}

export const canUndoEdit = <T,>(h: EditHistory<T>) => h.past.length > 0
export const canRedoEdit = <T,>(h: EditHistory<T>) => h.future.length > 0

/** Returns the new history plus the ops to apply (already inverted, last-first). */
export function undoEdit<TRow>(history: EditHistory<TRow>): { history: EditHistory<TRow>; ops: DatasetOp<TRow>[]; label: string } | null {
  const entry = history.past.at(-1)
  if (!entry) return null
  return {
    history: { past: history.past.slice(0, -1), future: [...history.future, entry] },
    ops: [...entry.ops].reverse().map(invertOp),
    label: entry.label,
  }
}

export function redoEdit<TRow>(history: EditHistory<TRow>): { history: EditHistory<TRow>; ops: DatasetOp<TRow>[]; label: string } | null {
  const entry = history.future.at(-1)
  if (!entry) return null
  return {
    history: { past: [...history.past, entry], future: history.future.slice(0, -1) },
    ops: [...entry.ops],
    label: entry.label,
  }
}

/** A blank record: every field at its type's empty value, keyed by `idKey`. */
export function emptyRow(fields: readonly FieldDef[], id: string, idKey = 'id'): Record<string, unknown> {
  return { ...Object.fromEntries(fields.map((f) => [f.id, emptyFieldValue(f.type)])), [idKey]: id }
}

/**
 * Apply ops to a dataset. Rows are copied only where they change, so a 20k-row
 * array costs one slice plus the touched rows.
 */
export function applyDatasetOps<TRow extends Record<string, unknown>>(
  data: { rows: readonly TRow[]; fields: readonly FieldDef[] },
  ops: readonly DatasetOp<TRow>[],
  idKey = 'id',
): { rows: TRow[]; fields: FieldDef[] } {
  let rows = data.rows as TRow[]
  let fields = [...data.fields]
  let copied = false
  const own = () => { if (!copied) { rows = [...rows]; copied = true } }
  let index: Map<string, number> | null = null
  const indexOf = (id: string) => {
    if (!index || rows.length !== index.size) index = new Map(rows.map((r, i) => [String(r[idKey]), i]))
    return index.get(id) ?? -1
  }
  for (const op of ops) {
    if (op.kind === 'cell') {
      const i = indexOf(op.rowId)
      if (i < 0) continue
      own()
      rows[i] = { ...rows[i], [op.field]: op.after }
    } else if (op.kind === 'insert-row') {
      own()
      rows.splice(Math.min(op.index, rows.length), 0, op.row)
      index = null
    } else if (op.kind === 'remove-row') {
      const i = indexOf(String(op.row[idKey]))
      if (i < 0) continue
      own()
      rows.splice(i, 1)
      index = null
    } else {
      fields = [...op.after]
    }
  }
  return { rows, fields }
}

/** A copy of a record under a new id, for Duplicate. */
export function duplicateRow<TRow extends Record<string, unknown>>(row: TRow, id: string, idKey = 'id'): TRow {
  return {
    ...row,
    [idKey]: id,
    // Arrays are values, not shared references, so editing the copy never touches the source.
    ...Object.fromEntries(Object.entries(row).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, [...(v as unknown[])]])),
  } as TRow
}
