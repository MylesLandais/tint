import type { HTMLAttributes, ReactNode, Ref } from 'react'
import type { TableFieldType } from './fieldTypes'

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
  /** Rows to render, already filtered/sorted/paged. See `deriveRows`. */
  rows: readonly TRow[]
  columns: readonly TableColumn<TRow>[]
  /** How to identify a row. A key name, or a function for composite ids. */
  rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)

  /** Accessible name for the table. */
  label?: string
  /** Visible caption. Prefer this over `label` when the name should be seen. */
  caption?: ReactNode
  density?: TableDensity
  /** Shown in place of the body when `rows` is empty. */
  emptyState?: ReactNode

  /** Column whose value labels the row for assistive tech. Renders as `<th scope="row">`. */
  rowHeaderColumn?: string

  sort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void

  /** Omit to disable selection entirely. */
  selection?: readonly TableRowId[]
  onSelectionChange?: (change: TableSelectionChange) => void
  /** Accessible label for a row's checkbox. Defaults to the row header value. */
  selectionLabel?: (row: TRow) => string

  /** Omit to disable expansion. */
  expanded?: readonly TableRowId[]
  onExpandedChange?: (expanded: readonly TableRowId[], rowId: TableRowId) => void
  /** Body of an expanded row. Returning null renders an empty-detail notice. */
  renderExpanded?: (row: TRow) => ReactNode

  /** Ids hidden from view. The table never hides the last visible column. */
  hiddenColumns?: readonly string[]
  onHiddenColumnsChange?: (hidden: readonly string[]) => void

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
