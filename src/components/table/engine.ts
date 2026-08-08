/*
 * The seam between tint's table components and the vendored engine.
 *
 * Nothing outside `src/components/table/` imports `src/vendor/` directly, so a
 * future engine change touches this file and `useDataTable.ts` and nothing else.
 *
 * The two functions below are why the port of `core/table.js` was not wasted:
 * TanStack takes sorting and filtering as pluggable functions, so the semantics
 * that `derive.test.ts` pins are registered with the engine rather than replaced
 * by it. A server-side `ORDER BY` and this client still agree.
 */

import type { Row } from '../../vendor/tanstack-table-core'
import { compareValues, matchesFilter } from './derive'
import type { TableFilter } from './types'

/*
 * Written as generic functions rather than typed against `SortingFn<T>` /
 * `FilterFn<T>`: both are structurally assignable to those for any row type, and
 * neither actually cares what a row is — they only read the cell value. That
 * avoids needing `any` or a module augmentation to register them by name.
 */

/**
 * Natural ordering with SQL null placement.
 *
 * TanStack multiplies this result by the sort direction, exactly as the original
 * pipeline did — so null lands last ascending and first descending, matching
 * PostgreSQL's default.
 */
export function tintNatural<TRow>(
  rowA: Row<TRow>,
  rowB: Row<TRow>,
  columnId: string,
): number {
  return compareValues(rowA.getValue(columnId), rowB.getValue(columnId))
}

/**
 * Predicate, numeric range, or case-insensitive substring — resolved in that
 * order, including the fix that excludes every spelling of absent from a range.
 */
export function tintFilter<TRow>(
  row: Row<TRow>,
  columnId: string,
  value: unknown,
): boolean {
  return matchesFilter(row.getValue(columnId), value as TableFilter)
}

/** Narrow a TanStack row back to the caller's row type. */
export function originalOf<TRow>(row: Row<TRow>): TRow {
  return row.original
}
