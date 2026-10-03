/*
 * Dataset schema and views: typed field definitions, the field commands behind
 * the header menu (add / rename / retype / hide / reorder / duplicate / set
 * primary), and saved views (filter, sort, group, hidden + ordered fields).
 * All functions are pure; hosts own the arrays they return.
 */
import { compareFieldValues, draftFromValue, emptyFieldValue, parseFieldValue } from './fieldValues'
import type { TableFieldType } from './fieldTypes'

export type FieldOption = { value: string; label?: string; color?: string }

export type FieldDef = {
  id: string
  name: string
  type: TableFieldType
  /** Choices for select / multi-select; target records for linked-record. */
  options?: readonly FieldOption[]
  readOnly?: boolean
  width?: number
}

export type ViewFilterOperator =
  | 'contains' | 'equals' | 'notEquals' | 'gt' | 'gte' | 'lt' | 'lte' | 'empty' | 'notEmpty'

export type ViewFilter = { id: string; field: string; operator: ViewFilterOperator; value?: string | number }
export type ViewSort = { field: string; desc: boolean }
export type RowHeight = 'short' | 'medium' | 'tall'

export type TableView = {
  id: string
  name: string
  filters: readonly ViewFilter[]
  sorts: readonly ViewSort[]
  groupBy?: string
  /** Field ids hidden in this view. Hidden fields still appear in the record panel. */
  hidden: readonly string[]
  /** Field ids in display order; missing ids append in schema order. */
  order: readonly string[]
  rowHeight: RowHeight
}

export const createView = (id: string, name: string, patch: Partial<TableView> = {}): TableView => ({
  id, name, filters: [], sorts: [], hidden: [], order: [], rowHeight: 'short', ...patch,
})

/** The first field is the record's identity: frozen, never hidden, shown in links. */
export const primaryField = (fields: readonly FieldDef[]): FieldDef | undefined => fields[0]

// ---------------------------------------------------------------------------
// Field commands
// ---------------------------------------------------------------------------

function uniqueId(base: string, fields: readonly FieldDef[]): string {
  const slug = base.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'field'
  let id = slug
  for (let n = 2; fields.some((f) => f.id === id); n++) id = `${slug}-${n}`
  return id
}

function uniqueName(name: string, fields: readonly FieldDef[]): string {
  let candidate = name
  for (let n = 2; fields.some((f) => f.name.toLowerCase() === candidate.toLowerCase()); n++) candidate = `${name} ${n}`
  return candidate
}

export function addField(fields: readonly FieldDef[], name: string, type: TableFieldType = 'text', at = fields.length): FieldDef[] {
  const finalName = uniqueName(name.trim() || 'Field', fields)
  const next = [...fields]
  next.splice(Math.max(1, Math.min(at, fields.length)), 0, { id: uniqueId(finalName, fields), name: finalName, type })
  return fields.length === 0 ? [next[0]] : next
}

export function renameField(fields: readonly FieldDef[], id: string, name: string): FieldDef[] {
  const trimmed = name.trim()
  if (!trimmed) return [...fields]
  const clash = fields.some((f) => f.id !== id && f.name.toLowerCase() === trimmed.toLowerCase())
  return fields.map((f) => (f.id === id && !clash ? { ...f, name: trimmed } : f))
}

export function duplicateField(fields: readonly FieldDef[], id: string): FieldDef[] {
  const index = fields.findIndex((f) => f.id === id)
  if (index < 0) return [...fields]
  const source = fields[index]
  const name = uniqueName(`${source.name} copy`, fields)
  const next = [...fields]
  next.splice(index + 1, 0, { ...source, id: uniqueId(name, fields), name })
  return next
}

export function removeField(fields: readonly FieldDef[], id: string): FieldDef[] {
  // The primary field is the record's identity and cannot be deleted.
  return fields.length <= 1 || fields[0].id === id ? [...fields] : fields.filter((f) => f.id !== id)
}

/** Move a field; index 0 is reserved for the primary field, so moves clamp to >= 1 unless promoting. */
export function moveField(fields: readonly FieldDef[], id: string, to: number): FieldDef[] {
  const from = fields.findIndex((f) => f.id === id)
  if (from <= 0) return [...fields]
  const next = [...fields]
  const [field] = next.splice(from, 1)
  next.splice(Math.max(1, Math.min(to, next.length)), 0, field)
  return next
}

export function setPrimaryField(fields: readonly FieldDef[], id: string): FieldDef[] {
  const field = fields.find((f) => f.id === id)
  return field ? [field, ...fields.filter((f) => f.id !== id)] : [...fields]
}

export type RetypeReport = {
  converted: number
  /** Values that could not be represented in the new type and were cleared. */
  cleared: number
  values: ReadonlyMap<string, unknown>
}

/** Dry-run a type change over every row so the UI can warn before data is lost. */
export function planRetype<TRow extends Record<string, unknown>>(
  rows: readonly TRow[],
  rowId: (row: TRow) => string,
  field: FieldDef,
  to: TableFieldType,
): RetypeReport {
  const values = new Map<string, unknown>()
  let converted = 0
  let cleared = 0
  for (const row of rows) {
    const before = row[field.id]
    if (before == null || before === '' || (Array.isArray(before) && before.length === 0)) {
      values.set(rowId(row), emptyFieldValue(to))
      continue
    }
    const parsed = parseFieldValue(to, draftFromValue(field.type, before))
    if (parsed.ok) { values.set(rowId(row), parsed.value); converted++ }
    else { values.set(rowId(row), emptyFieldValue(to)); cleared++ }
  }
  return { converted, cleared, values }
}

export function retypeField(fields: readonly FieldDef[], id: string, to: TableFieldType): FieldDef[] {
  return fields.map((f) => (f.id === id ? { ...f, type: to } : f))
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/** Fields in this view's order, hidden ones removed. The primary field is never hidden. */
export function visibleFields(fields: readonly FieldDef[], view: TableView): FieldDef[] {
  const rank = new Map(view.order.map((id, i) => [id, i]))
  const primary = fields[0]
  const rest = fields
    .slice(1)
    .map((f, i) => ({ f, key: rank.get(f.id) ?? view.order.length + i }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.f)
    .filter((f) => !view.hidden.includes(f.id))
  return primary ? [primary, ...rest] : rest
}

export function toggleFieldHidden(view: TableView, fieldId: string, primaryId?: string): TableView {
  if (fieldId === primaryId) return view
  const hidden = view.hidden.includes(fieldId) ? view.hidden.filter((id) => id !== fieldId) : [...view.hidden, fieldId]
  return { ...view, hidden }
}

const isBlank = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)

export function matchesViewFilter(value: unknown, type: TableFieldType | undefined, filter: ViewFilter): boolean {
  if (filter.operator === 'empty') return isBlank(value)
  if (filter.operator === 'notEmpty') return !isBlank(value)
  const needle = filter.value
  if (needle == null || needle === '') return true
  const hay = Array.isArray(value) ? value.join(' ') : draftFromValue(type, value)
  const text = hay.toLowerCase()
  const q = String(needle).toLowerCase()
  switch (filter.operator) {
    case 'contains': return text.includes(q)
    case 'equals': return Array.isArray(value) ? value.some((v) => String(v).toLowerCase() === q) : text === q
    case 'notEquals': return Array.isArray(value) ? !value.some((v) => String(v).toLowerCase() === q) : text !== q
    default: {
      // Relational operators fail closed on blanks and non-numerics, like the core filter pipeline.
      const a = Number(value)
      const b = Number(needle)
      if (isBlank(value) || Number.isNaN(a) || Number.isNaN(b)) return false
      return filter.operator === 'gt' ? a > b : filter.operator === 'gte' ? a >= b : filter.operator === 'lt' ? a < b : a <= b
    }
  }
}

export type RowGroup<TRow> = { key: string; label: string; rows: TRow[] }

export type ViewResult<TRow> = {
  rows: TRow[]
  /** Present when the view groups; `rows` is the flat concatenation in group order. */
  groups?: RowGroup<TRow>[]
}

/** Apply a view's filters, sorts and grouping to rows. Stable; empties sort last. */
export function applyView<TRow extends Record<string, unknown>>(
  rows: readonly TRow[],
  fields: readonly FieldDef[],
  view: TableView,
): ViewResult<TRow> {
  const byId = new Map(fields.map((f) => [f.id, f]))
  let out = rows.filter((row) =>
    view.filters.every((flt) => {
      const f = byId.get(flt.field)
      return f ? matchesViewFilter(row[f.id], f.type, flt) : true
    }),
  )
  const sorts = [...view.sorts]
  if (view.groupBy && byId.has(view.groupBy)) sorts.unshift({ field: view.groupBy, desc: false })
  const active = sorts.filter((s) => byId.has(s.field))
  if (active.length) {
    out = out
      .map((row, i) => ({ row, i }))
      .sort((a, b) => {
        for (const s of active) {
          const f = byId.get(s.field)!
          const base = compareFieldValues(f.type, a.row[f.id], b.row[f.id])
          // Blanks stay last in both directions; only real values flip.
          const blank = isBlank(a.row[f.id]) || isBlank(b.row[f.id])
          const c = s.desc && !blank ? -base : base
          if (c !== 0) return c
        }
        return a.i - b.i
      })
      .map((x) => x.row)
  }
  if (!view.groupBy || !byId.has(view.groupBy)) return { rows: out }
  const field = byId.get(view.groupBy)!
  const groups = new Map<string, RowGroup<TRow>>()
  for (const row of out) {
    const v = row[field.id]
    const key = isBlank(v) ? '' : Array.isArray(v) ? String(v[0]) : String(v)
    const g = groups.get(key) ?? { key, label: key || 'Empty', rows: [] }
    g.rows.push(row)
    groups.set(key, g)
  }
  return { rows: out, groups: [...groups.values()] }
}

/** Adds a choice to a select / multi-select field. No-op when it already exists (case-insensitive). */
export function addFieldOption(field: FieldDef, value: string): FieldDef {
  const trimmed = value.trim()
  if (!trimmed || field.options?.some((o) => o.value.toLowerCase() === trimmed.toLowerCase())) return field
  return { ...field, options: [...(field.options ?? []), { value: trimmed }] }
}
