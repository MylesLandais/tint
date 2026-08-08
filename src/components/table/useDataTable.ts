import { useMemo, useState } from 'react'
import {
  createTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type Table,
  type TableState,
  type Updater,
} from '../../vendor/tanstack-table-core'
import { tintFilter, tintNatural } from './engine'
import type { TableColumn } from './types'

/**
 * Build a table instance from tint column definitions.
 *
 * This is the opt-in path for callers who want the whole engine — faceting,
 * grouping, column sizing, multi-column sorting. `deriveRows` remains the
 * simpler pure-function path for callers who only need filter/sort/paginate and
 * would rather not hold an instance.
 *
 * Uncontrolled by default: pass `state` and `onStateChange` to drive it from
 * outside, exactly as `DataTable`'s individual props do.
 */
export function useDataTable<TRow>({
  data,
  columns,
  rowId,
  state: controlledState,
  onStateChange,
  initialState,
}: {
  data: readonly TRow[]
  columns: readonly TableColumn<TRow>[]
  rowId: (keyof TRow & string) | ((row: TRow) => string)
  state?: Partial<TableState>
  onStateChange?: (state: TableState) => void
  initialState?: Partial<TableState>
}): Table<TRow> {
  const [internalState, setInternalState] = useState<Partial<TableState>>(
    () => initialState ?? {},
  )

  const columnDefs = useMemo<ColumnDef<TRow, unknown>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: column.accessor
          ? (row: TRow) => column.accessor!(row)
          : (row: TRow) => (row as Record<string, unknown>)[column.id],
        header: () => column.header ?? column.id,
        enableSorting: column.sortable ?? false,
        enableHiding: column.hideable !== false,
        size: column.width,
        // The ported semantics, not TanStack's defaults.
        sortingFn: tintNatural,
        filterFn: tintFilter,
      })),
    [columns],
  )

  const table = useMemo(() => {
    const instance = createTable<TRow>({
      data: data as TRow[],
      columns: columnDefs,
      state: {},
      onStateChange: () => {},
      renderFallbackValue: null,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getRowId: typeof rowId === 'function' ? (row) => rowId(row) : undefined,
    })
    return instance
    // Rebuilt only when the shape changes; row and state updates go through
    // setOptions below, which is how TanStack expects to be driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const state = controlledState ?? internalState

  table.setOptions((previous) => ({
    ...previous,
    data: data as TRow[],
    columns: columnDefs,
    state: { ...table.initialState, ...state },
    getRowId:
      typeof rowId === 'function'
        ? (row: TRow) => rowId(row)
        : (row: TRow) => String(row[rowId]),
    onStateChange: (updater: Updater<TableState>) => {
      const next =
        typeof updater === 'function'
          ? updater({ ...table.initialState, ...state } as TableState)
          : updater
      if (onStateChange) onStateChange(next)
      else setInternalState(next)
    },
  }))

  return table
}
