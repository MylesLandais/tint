import { toDeriveFilters, toTableSort } from './clientState'
import { deriveFilteredSortedRows, deriveRows } from './derive'
import type { DataFilterModel, DataSortingState } from './filterTypes'
import type { TableColumnCore } from './types'

export type WorkbenchInspectorTab = 'details' | 'proposal' | 'evidence' | 'history'

export type WorkbenchQuery = {
  filterModel: DataFilterModel
  sorting: DataSortingState
  page: number
  pageSize: number
}

/** Client-side workbench pipeline; the UI only renders these derived rows. */
export function deriveWorkbenchRows<TRow>(
  rows: readonly TRow[],
  columns: readonly TableColumnCore<TRow>[],
  query: WorkbenchQuery,
): { rows: readonly TRow[]; total: number; page: number } {
  const input = { columns, sort: toTableSort(query.sorting), filters: toDeriveFilters(query.filterModel) }
  const total = deriveFilteredSortedRows(rows, input).length
  const size = Number.isSafeInteger(query.pageSize) && query.pageSize > 0 ? query.pageSize : 1
  const lastPage = Math.max(0, Math.ceil(total / size) - 1)
  const requestedPage = Number.isSafeInteger(query.page) ? query.page : 0
  const page = Math.min(Math.max(0, requestedPage), lastPage)
  return { rows: deriveRows(rows, { ...input, page: { index: page, size } }), total, page }
}
