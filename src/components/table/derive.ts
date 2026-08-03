/*
 * The table behavior core, ported from the framework-neutral `core/table.js`
 * that the Alpine implementation runs on.
 *
 * The semantics here are the contract: comparator ordering, filter predicate
 * resolution, and the stage order of the pipeline all behave exactly as they do
 * there, so a FastAPI or Phoenix backend sorting the same rows agrees with the
 * client. `derive.test.ts` pins each one.
 *
 * The one deliberate break: the original exposed `actions` that mutated a state
 * object in place. Everything here is pure and returns new values, because the
 * React surface is strictly controlled — the caller owns the state.
 */

import type { TableColumn, TableFilter, TableSort } from './types'

/** Read a column's value off a row. Columns may override with `accessor`. */
export function getCellValue<TRow>(
  row: TRow | undefined,
  column: Pick<TableColumn<TRow>, 'id' | 'accessor'>,
): unknown {
  if (!row) return undefined
  if (column.accessor) return column.accessor(row)
  return Object.prototype.hasOwnProperty.call(row, column.id)
    ? (row as Record<string, unknown>)[column.id]
    : undefined
}

/**
 * Total order used by every sort.
 *
 * Null sorts *after* every real value, and because the sort stage multiplies
 * this result by the direction, that means nulls land last ascending and first
 * descending. That is not an oversight — it is PostgreSQL's default
 * (`NULLS LAST` for `ASC`, `NULLS FIRST` for `DESC`), so a server-side `ORDER BY`
 * and this client agree without either side special-casing the other.
 *
 * Numbers compare numerically; everything else uses natural collation, so
 * `track 2` precedes `track 10` rather than following it.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

/**
 * Resolve one filter against one value.
 *
 * - `null`/`undefined`/`''` — no filter, everything passes.
 * - function — an arbitrary predicate, so a caller can supply domain logic
 *   (Camelot key adjacency, say) without the table knowing anything about it.
 * - `{ min, max }` — numeric range. Absent or non-numeric values fail closed.
 * - anything else — case-insensitive substring.
 */
export function matchesFilter(value: unknown, filter: TableFilter): boolean {
  if (filter == null || filter === '') return true
  if (typeof filter === 'function') return Boolean(filter(value))

  if (typeof filter === 'object' && !Array.isArray(filter)) {
    const { min, max } = filter
    // Absent data is excluded from every range. The original leaned on
    // `Number(value)`, which quietly coerces `null` and `''` to 0 while leaving
    // `undefined` as NaN — so a null BPM passed `{ min: 0 }` but an undefined one
    // did not. Three spellings of "missing" behaving two different ways is a bug,
    // not a contract worth preserving.
    if (value == null || value === '') return false
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(n)) return false
    if (min != null && n < min) return false
    if (max != null && n > max) return false
    return true
  }

  return String(value ?? '')
    .toLowerCase()
    .includes(String(filter).toLowerCase())
}

/** A filter entry that would actually exclude something. */
function isActiveFilter(filter: TableFilter): boolean {
  if (filter == null || filter === '') return false
  if (typeof filter === 'function') return true
  if (typeof filter === 'object' && !Array.isArray(filter)) {
    return filter.min != null || filter.max != null
  }
  return true
}

export type DeriveStage<TRow> = {
  name: string
  apply: (rows: readonly TRow[], input: DeriveInput<TRow>) => readonly TRow[]
}

export type DeriveInput<TRow> = {
  columns: readonly TableColumn<TRow>[]
  sort?: TableSort | null
  filters?: Readonly<Record<string, TableFilter>>
  page?: { index: number; size: number } | null
  stages?: readonly DeriveStage<TRow>[]
}

/**
 * Stage order is fixed by rank, not by array position, so a caller passing a
 * custom stage lands in a predictable slot no matter where they put it.
 * Pagination is last by construction — paginating before filtering would page
 * over rows that were about to disappear.
 */
const STAGE_RANK: Record<string, number> = {
  filter: 10,
  sort: 20,
  group: 30,
  paginate: 40,
}
const DEFAULT_RANK = 25

function rank(name: string) {
  return STAGE_RANK[name] ?? DEFAULT_RANK
}

function columnById<TRow>(columns: readonly TableColumn<TRow>[]) {
  return new Map(columns.map((column) => [column.id, column]))
}

const filterStage = <TRow,>(): DeriveStage<TRow> => ({
  name: 'filter',
  apply(rows, { columns, filters }) {
    const entries = Object.entries(filters ?? {}).filter(([, filter]) =>
      isActiveFilter(filter),
    )
    if (!entries.length) return rows

    const lookup = columnById(columns)
    return rows.filter((row) =>
      entries.every(([columnId, filter]) => {
        const column = lookup.get(columnId) ?? { id: columnId }
        return matchesFilter(getCellValue(row, column), filter)
      }),
    )
  },
})

const sortStage = <TRow,>(): DeriveStage<TRow> => ({
  name: 'sort',
  apply(rows, { columns, sort }) {
    if (!sort?.column) return rows
    const column = columnById(columns).get(sort.column) ?? { id: sort.column }
    const direction = sort.direction === 'desc' ? -1 : 1

    return rows
      .slice()
      .sort(
        (a, b) =>
          direction * compareValues(getCellValue(a, column), getCellValue(b, column)),
      )
  },
})

const paginateStage = <TRow,>(): DeriveStage<TRow> => ({
  name: 'paginate',
  apply(rows, { page }) {
    if (!page) return rows
    const size = Math.max(1, page.size)
    const index = Math.max(0, page.index)
    const start = index * size
    return rows.slice(start, start + size)
  },
})

/**
 * Run rows through filter → sort → group → paginate.
 *
 * Exported rather than folded into the component: keeping it pure is what lets a
 * caller sort on the server, drive state from the URL, or compute a total count
 * without rendering anything.
 */
export function deriveRows<TRow>(
  rows: readonly TRow[],
  input: DeriveInput<TRow>,
): readonly TRow[] {
  const stages = [
    filterStage<TRow>(),
    sortStage<TRow>(),
    paginateStage<TRow>(),
    ...(input.stages ?? []),
  ].sort((a, b) => rank(a.name) - rank(b.name))

  return stages.reduce<readonly TRow[]>(
    (current, stage) => stage.apply(current, input),
    rows,
  )
}

/**
 * The same pipeline without pagination — the denominator for "1–40 of 673".
 */
export function deriveFilteredSortedRows<TRow>(
  rows: readonly TRow[],
  input: DeriveInput<TRow>,
): readonly TRow[] {
  return deriveRows(rows, { ...input, page: null })
}

/**
 * Advance a tri-state sort: unsorted → ascending → descending → unsorted.
 *
 * Returning to unsorted matters — without it there is no way back to the row
 * order the data arrived in.
 */
export function nextSort(current: TableSort | null | undefined, columnId: string): TableSort | null {
  if (!current || current.column !== columnId) {
    return { column: columnId, direction: 'asc' }
  }
  return current.direction === 'asc' ? { column: columnId, direction: 'desc' } : null
}

/** Columns in order, minus hidden ones. */
export function visibleColumns<TRow>(
  columns: readonly TableColumn<TRow>[],
  hidden: Iterable<string> = [],
): readonly TableColumn<TRow>[] {
  const hiddenSet = new Set(hidden)
  return columns.filter((column) => !hiddenSet.has(column.id))
}
