import type { DataFilterItem, DataFilterModel, DataSortingState } from './filterTypes'

export type TableQueryState = {
  filters: DataFilterModel
  sorting: DataSortingState
  page: { index: number; size: number }
}

/** Stable URL value and selection key for a serializable table query. */
export function serializeTableQuery(query: TableQueryState): string {
  const params = new URLSearchParams()
  for (const item of query.filters.items) {
    params.append('filter', JSON.stringify([
      item.id, item.field, item.operator, item.value, item.displayValue ?? null,
    ]))
  }
  for (const item of query.sorting) params.append('sort', JSON.stringify([item.id, item.desc]))
  params.set('page', String(Math.max(0, Math.trunc(query.page.index))))
  params.set('size', String(Math.max(1, Math.trunc(query.page.size))))
  return params.toString()
}

/** A query-wide selection survives page and sort changes, but not filter changes. */
export function matchingQueryKey(query: Pick<TableQueryState, 'filters'>): string {
  const params = new URLSearchParams()
  const items = [...query.filters.items].sort((a, b) =>
    `${a.field}\u0000${a.operator}\u0000${a.value}\u0000${a.id}`.localeCompare(`${b.field}\u0000${b.operator}\u0000${b.value}\u0000${b.id}`))
  for (const item of items) {
    params.append('filter', JSON.stringify([
      item.id, item.field, item.operator, item.value,
    ]))
  }
  return params.toString()
}

const OPERATORS = new Set(['contains', 'equals', 'notEquals', 'gt', 'gte', 'lt', 'lte'])

function parseFilter(raw: string): DataFilterItem | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length !== 5) return null
    const [id, field, operator, filterValue, displayValue] = value
    if (typeof id !== 'string' || typeof field !== 'string' || !OPERATORS.has(operator)) return null
    if (typeof filterValue !== 'string' && typeof filterValue !== 'number') return null
    if (displayValue != null && typeof displayValue !== 'string') return null
    return {
      id, field, operator,
      value: filterValue,
      ...(displayValue === null ? {} : { displayValue }),
    } as DataFilterItem
  } catch {
    return null
  }
}

function parseSort(raw: string): DataSortingState[number] | null {
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'boolean'
      ? { id: value[0], desc: value[1] }
      : null
  } catch {
    return null
  }
}

function positiveInteger(value: string | null, fallback: number, min: number): number {
  const parsed = value === null ? NaN : Number(value)
  return Number.isSafeInteger(parsed) && parsed >= min ? parsed : fallback
}

export function parseTableQuery(value: string, fallback: TableQueryState): TableQueryState {
  const params = new URLSearchParams(value.startsWith('?') ? value.slice(1) : value)
  return {
    filters: { items: params.getAll('filter').map(parseFilter).filter((item): item is DataFilterItem => item !== null) },
    sorting: params.getAll('sort').map(parseSort).filter((item): item is DataSortingState[number] => item !== null),
    page: {
      index: positiveInteger(params.get('page'), fallback.page.index, 0),
      size: positiveInteger(params.get('size'), fallback.page.size, 1),
    },
  }
}
