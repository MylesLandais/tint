import type { Snippet } from 'svelte'
import type {
  TableColumnCore,
  TableDensity,
  TableEditAdapter,
  TableEditCommit,
  TableResizeConfig,
  TableResizeEvent,
  TableRowId,
  TableSelectionChange,
  TableSort,
} from '../../../core/table/types'
import type { TableSelectionModel } from '../../../core/table/selection'
import type { TableInstance } from '../../../core/table/engine'

export type TableColumn<TRow> = TableColumnCore<TRow> & {
  header?: string | Snippet
  renderCell?: Snippet<[TRow, unknown]>
}

export type TableEditConfig<TRow> = {
  adapter: TableEditAdapter<TRow>
  onCommit?: (event: TableEditCommit<TRow>) => void
  onCreate?: (row: TRow) => void
  onDelete?: (rowId: TableRowId) => void
  onError?: (error: Error) => void
}

export type DataTableProps<TRow> = {
  /** Pass already sorted, filtered, paged rows; deriveRows remains framework-neutral. */
  rows?: readonly TRow[]
  /** Vendored v8 engine instance; the host must trigger Svelte updates on engine state changes. */
  table?: TableInstance<TRow>
  /** Increment when a stable v8 table instance changes its internal row model. */
  tableVersion?: number
  columns: readonly TableColumn<TRow>[]
  rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)
  label?: string
  caption?: string
  density?: TableDensity
  emptyState?: Snippet
  rowHeaderColumn?: string
  sort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  selection?: readonly TableRowId[]
  onSelectionChange?: (change: TableSelectionChange) => void
  /** Query mode selects matching rows outside the current page, minus exceptions. */
  selectionModel?: TableSelectionModel
  onSelectionModelChange?: (selection: TableSelectionModel) => void
  selectionQueryKey?: string
  selectionLabel?: (row: TRow) => string
  expanded?: readonly TableRowId[]
  onExpandedChange?: (expanded: readonly TableRowId[], rowId: TableRowId) => void
  renderExpanded?: Snippet<[TRow]>
  hiddenColumns?: readonly string[]
  /** Kept for API parity; TableColumnsMenu emits changes and the host passes them back. */
  onHiddenColumnsChange?: (hidden: readonly string[]) => void
  resizing?: TableResizeConfig
  columnWidths?: Readonly<Record<string, number>>
  rowHeights?: Readonly<Record<TableRowId, number>>
  onColumnWidthsChange?: (widths: Readonly<Record<string, number>>) => void
  onRowHeightsChange?: (heights: Readonly<Record<TableRowId, number>>) => void
  onResize?: (event: TableResizeEvent) => void
  editing?: TableEditConfig<TRow>
  activeRowId?: TableRowId | null
  onActiveRowChange?: (rowId: TableRowId) => void
  /** Fixed-height virtual rows use TanStack Virtual; expanded rows render normally. */
  virtual?: boolean
  virtualHeight?: number
  /** Apply Genre, BPM, State hide priority using the table's measured width. */
  workbenchResponsive?: boolean
  class?: string
}
