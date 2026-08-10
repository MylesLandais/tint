import type { HTMLAttributes, ReactNode, Ref } from 'react'
import type { Table as TableInstance } from '../../vendor/tanstack-table-core'
import type { TableFieldType } from './fieldTypes'

export type { TableInstance }

/** Rows are keyed by string throughout — ids are coerced at the boundary. */
export type TableRowId = string

export type TableSortDirection = 'asc' | 'desc'

/** `null` means unsorted, which is a state the tri-state header cycles back to. */
export type TableSort = {
  column: string
  direction: TableSortDirection
}

/** Numeric bound. Either end may be omitted for an open range. */
export type TableRangeFilter = {
  min?: number
  max?: number
}

/**
 * A predicate, a numeric range, or a substring. Passing a function is how a
 * caller supplies domain logic the table has no business knowing — Camelot key
 * adjacency, for instance.
 */
export type TableFilter =
  | string
  | number
  | TableRangeFilter
  | ((value: unknown) => boolean)
  | null
  | undefined

export type TableAlign = 'start' | 'end'

export type TableColumn<TRow> = {
  /** Stable id. Also the default key read off the row. */
  id: string
  /** Header content. Falls back to the id when absent. */
  header?: ReactNode
  /** Override how the value is read. Defaults to `row[id]`. */
  accessor?: (row: TRow) => unknown
  /** Selects formatting and alignment. Defaults to `text`. */
  type?: TableFieldType
  /** Full control over the cell body. Wins over `type`. */
  renderCell?: (row: TRow) => ReactNode
  /** Show a sort control in the header. */
  sortable?: boolean
  /** `false` keeps the column out of the columns menu — it cannot be hidden. */
  hideable?: boolean
  /** Pin to the left edge during horizontal scroll. */
  pinned?: boolean
  /** Width in pixels. Required for pinned columns so offsets can be summed. */
  width?: number
  /** Overrides the alignment the field type would choose. */
  align?: TableAlign
  /** Accessible name for the sort control when `header` is not a plain string. */
  label?: string
  /** Allow inline editing for this column. */
  editable?: boolean | ((row: TRow) => boolean)
  /** Convert the editor's string value before it is sent to the adapter. */
  parseEditValue?: (value: string, previous: unknown, row: TRow) => unknown
}

export type TableResizeAxis = 'column' | 'row'
export type TableResizePhase = 'start' | 'move' | 'end'
export type TableResizeEvent = {
  axis: TableResizeAxis
  id: string
  size: number
  phase: TableResizePhase
}

export type TableResizeConfig = {
  columns?: boolean
  rows?: boolean
  minColumnWidth?: number
  minRowHeight?: number
}

export type TableEditAdapter<TRow> = {
  create?: (values: Partial<TRow>) => Promise<TRow>
  update?: (rowId: TableRowId, changes: Partial<TRow>) => Promise<TRow>
  delete?: (rowId: TableRowId) => Promise<void>
}

export type TableEditCommit<TRow> = {
  rowId: TableRowId
  column: string
  value: unknown
  row: TRow
}

export type TableEditConfig<TRow> = {
  adapter: TableEditAdapter<TRow>
  onCommit?: (event: TableEditCommit<TRow>) => void
  onCreate?: (row: TRow) => void
  onDelete?: (rowId: TableRowId) => void
  onError?: (error: Error) => void
}

/** Row height scale. Matches `ChatConversation`'s vocabulary. */
export type TableDensity = 'compact' | 'comfortable' | 'spacious'

export type TableSelectionChange = {
  /** The full next selection. */
  selection: readonly TableRowId[]
  /** The row that caused it, or `null` for a select-all-visible toggle. */
  rowId: TableRowId | null
  selected: boolean
}

export type DataTableProps<TRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect'
> & {
  /**
   * Rows to render, already filtered/sorted/paged. See `deriveRows`.
   *
   * Ignored when `table` is supplied — that is the path where the engine owns
   * the row model, and it is what lets a grid and a masonry render the same
   * sorted, filtered rows without duplicating any state.
   */
  rows?: readonly TRow[]
  /** A `useDataTable` instance. Supplies rows in place of the `rows` prop. */
  table?: TableInstance<TRow>
  /** Column definitions, in display order. Hiding is separate — see `hiddenColumns`. */
  columns: readonly TableColumn<TRow>[]
  /** How to identify a row. A key name, or a function for composite ids. */
  rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)

  /** Accessible name for the table. */
  label?: string
  /** Visible caption. Prefer this over `label` when the name should be seen. */
  caption?: ReactNode
  /** Row height scale: `compact` 1.75rem, `comfortable` 2.5rem, `spacious` 3.25rem. */
  density?: TableDensity
  /** Shown in place of the body when `rows` is empty. */
  emptyState?: ReactNode

  /** Column whose value labels the row for assistive tech. Renders as `<th scope="row">`. */
  rowHeaderColumn?: string

  /** Controlled sort. Sorting the rows is the caller's job — see `deriveRows`. */
  sort?: TableSort | null
  /** Receives the next sort as the header cycles asc -> desc -> none. */
  onSortChange?: (sort: TableSort | null) => void

  /** Selected row ids. Omit — or omit `onSelectionChange` — to disable selection. */
  selection?: readonly TableRowId[]
  /**
   * Receives the full next selection plus which row changed. `rowId` is null
   * when the header checkbox toggled every visible row at once.
   */
  onSelectionChange?: (change: TableSelectionChange) => void
  /** Accessible label for a row's checkbox. Defaults to the row header value. */
  selectionLabel?: (row: TRow) => string

  /** Expanded row ids. Expansion needs all three of these props to appear. */
  expanded?: readonly TableRowId[]
  onExpandedChange?: (expanded: readonly TableRowId[], rowId: TableRowId) => void
  /** Body of an expanded row. Returning null renders an empty-detail notice. */
  renderExpanded?: (row: TRow) => ReactNode

  /** Ids hidden from view. The table never hides the last visible column. */
  hiddenColumns?: readonly string[]
  onHiddenColumnsChange?: (hidden: readonly string[]) => void

  /**
   * Enables drag and keyboard resizing, per axis, with optional minimums.
   * Handles are focusable and respond to arrow keys (Shift for a coarse step).
   */
  resizing?: TableResizeConfig
  /**
   * Controlled column widths, in pixels, keyed by column id. Omit to let the
   * table hold them internally — `onColumnWidthsChange` still fires either way,
   * so a host can persist them without taking ownership.
   */
  columnWidths?: Readonly<Record<string, number>>
  /** Controlled row heights, in pixels, keyed by row id. Same contract as above. */
  rowHeights?: Readonly<Record<TableRowId, number>>
  /** Fires on every change during a drag, not only at the end. */
  onColumnWidthsChange?: (widths: Readonly<Record<string, number>>) => void
  onRowHeightsChange?: (heights: Readonly<Record<TableRowId, number>>) => void
  /**
   * Lower-level resize signal carrying the `start` / `move` / `end` phase —
   * for hosts that want to persist only on `end`.
   */
  onResize?: (event: TableResizeEvent) => void
  /**
   * Inline editing. The adapter's `update`, `create`, and `delete` are async and
   * own persistence; the table only drives the cell UI and reports outcomes.
   * A cell is editable only when `adapter.update` exists *and* the column opts
   * in via `editable`. Double-click or press Enter on a cell to begin.
   */
  editing?: TableEditConfig<TRow>

  /** Access to the scroll viewport. */
  ref?: Ref<HTMLDivElement>
}

export type TableToolbarProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode
}

export type TableColumnsMenuProps<TRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  columns: readonly TableColumn<TRow>[]
  /** Named to match `DataTable`. A bare `hidden` would collide with the DOM attribute. */
  hiddenColumns: readonly string[]
  onChange: (hidden: readonly string[]) => void
  label?: string
}

export type TablePagerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  /** Zero-based. */
  page: number
  pageSize: number
  /** Rows after filtering, before pagination. */
  total: number
  onChange: (page: number) => void
  label?: string
}

export type TableViewState = {
  hiddenColumns: readonly string[]
  pinnedColumns: readonly string[]
}
