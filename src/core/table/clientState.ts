/*
 * Typed client state for sort + filter — public controlled API.
 *
 * Shapes follow the seams we traced upstream:
 * - Sorting: TanStack `SortingState` as `[{ id, desc }]`
 *   (`~/Workspace-git/table/packages/table-core/src/features/row-sorting/`)
 * - Filtering: MUI X `GridFilterModel` items `{ id, field, operator, value }`
 *   (`~/Workspace-git/mui-x/packages/x-data-grid/src/models/gridFilterModel.ts`)
 *
 * Hosts own `DataFilterModel` + `DataSortingState`. Adapters below feed
 * `deriveRows` / `useDataTable` without replacing their legacy contracts.
 */

import type {
  DataFilterItem,
  DataFilterModel,
  DataFilterOperator,
  DataSortingState,
} from './filterTypes'
import type { TableFilter, TableSort } from './types'

/** TanStack `ColumnFilter` shape — kept local so callers need not import vendor. */
export type ColumnFilterEntry = {
  id: string
  value: unknown
}

const RELATIONAL: ReadonlySet<DataFilterOperator> = new Set([
  'gt',
  'gte',
  'lt',
  'lte',
])

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(n) ? null : n
}

/**
 * Evaluate one MUI-style filter item against a cell value.
 *
 * Relational ops fail closed on absent/NaN (same spirit as range filters in
 * `matchesFilter`). `equals` / `notEquals` compare numerically when the
 * expected value is a number; otherwise case-insensitive strings.
 */
export function evaluateFilterItem(
  value: unknown,
  item: Pick<DataFilterItem, 'operator' | 'value'>,
): boolean {
  const { operator, value: expected } = item

  if (RELATIONAL.has(operator)) {
    const n = asNumber(value)
    const target = asNumber(expected)
    if (n == null || target == null) return false
    switch (operator) {
      case 'gt':
        return n > target
      case 'gte':
        return n >= target
      case 'lt':
        return n < target
      case 'lte':
        return n <= target
      default:
        return false
    }
  }

  if (
    (operator === 'equals' || operator === 'notEquals') &&
    typeof expected === 'number'
  ) {
    const n = asNumber(value)
    if (n == null) return operator === 'notEquals'
    return operator === 'equals' ? n === expected : n !== expected
  }

  const left = String(value ?? '').toLowerCase()
  const right = String(expected ?? '').toLowerCase()

  switch (operator) {
    case 'contains':
      return left.includes(right)
    case 'equals':
      return left === right
    case 'notEquals':
      return left !== right
    default:
      return left.includes(right)
  }
}

/**
 * Primary-column sort for header/tri-state chrome.
 * Empty sorting → unsorted (`null`).
 */
export function toTableSort(sorting: DataSortingState): TableSort | null {
  const primary = sorting[0]
  if (!primary?.id) return null
  return {
    column: primary.id,
    direction: primary.desc ? 'desc' : 'asc',
  }
}

/** Inverse of `toTableSort` for syncing header clicks into client sorting state. */
export function toDataSortingState(sort: TableSort | null | undefined): DataSortingState {
  if (!sort?.column) return []
  return [{ id: sort.column, desc: sort.direction === 'desc' }]
}

/**
 * Build a `deriveRows` filter map from a filter model.
 *
 * All items are AND-ed (MUI default `logicOperator: and`). Multiple items on
 * the same field collapse into one predicate that ANDs those items.
 */
export function toDeriveFilters(
  model: DataFilterModel,
): Readonly<Record<string, TableFilter>> {
  const byField = new Map<string, DataFilterItem[]>()
  for (const item of model.items) {
    const list = byField.get(item.field) ?? []
    list.push(item)
    byField.set(item.field, list)
  }

  const filters: Record<string, TableFilter> = {}
  for (const [field, items] of byField) {
    filters[field] = (cell: unknown) =>
      items.every((item) => evaluateFilterItem(cell, item))
  }
  return filters
}

/**
 * TanStack `columnFilters` entries. Values are predicates so `tintFilter` /
 * `matchesFilter` apply operator semantics without extending the engine.
 */
export function toColumnFilters(model: DataFilterModel): ColumnFilterEntry[] {
  const derive = toDeriveFilters(model)
  return Object.entries(derive).map(([id, value]) => ({ id, value }))
}
