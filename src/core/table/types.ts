/** Framework-neutral table contracts shared by React and Svelte renderers. */
export type TableRowId = string
export type TableSortDirection = 'asc' | 'desc'
export type TableSort = { column: string; direction: TableSortDirection }
export type TableRangeFilter = { min?: number; max?: number }
export type TableFilter =
  | string
  | number
  | TableRangeFilter
  | ((value: unknown) => boolean)
  | null
  | undefined

export type TableAlign = 'start' | 'end'
export type TableColumnCore<TRow> = {
  id: string
  accessor?: (row: TRow) => unknown
  type?: import('./fieldTypes').TableFieldType
  sortable?: boolean
  hideable?: boolean
  pinned?: boolean
  width?: number
  align?: TableAlign
  label?: string
  editable?: boolean | ((row: TRow) => boolean)
  parseEditValue?: (value: string, previous: unknown, row: TRow) => unknown
}

export type TableDensity = 'compact' | 'comfortable' | 'spacious'
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

export type TableSelectionChange = {
  selection: readonly TableRowId[]
  rowId: TableRowId | null
  selected: boolean
}

export type TableViewState = {
  hiddenColumns: readonly string[]
  pinnedColumns: readonly string[]
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
