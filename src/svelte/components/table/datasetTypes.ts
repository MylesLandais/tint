import type { DatasetOp, FieldDef, TableFieldType, TableView } from '../../../core/table'

export type DatasetGridProps<TRow extends Record<string, unknown>> = {
  fields: readonly FieldDef[]
  /** Every record; the view filters, sorts and groups them. */
  rows: readonly TRow[]
  view: TableView
  label: string
  /** Property that uniquely identifies a row. */
  idKey?: string
  /** Scroll-viewport height in px. */
  height?: number
  readOnly?: boolean
  onEdit?: (ops: DatasetOp<TRow>[], label: string) => void
  onViewChange?: (view: TableView) => void
  onFieldWidth?: (fieldId: string, width: number) => void
  onOpenRecord?: (rowId: string) => void
  onUndo?: () => void
  onRedo?: () => void
  newRowId?: () => string
}

export type FieldAction =
  | { kind: 'rename'; name: string }
  | { kind: 'retype'; type: TableFieldType }
  | { kind: 'sort'; desc: boolean }
  | { kind: 'group' }
  | { kind: 'filter' }
  | { kind: 'hide' }
  | { kind: 'duplicate' }
  | { kind: 'primary' }
  | { kind: 'delete' }

export type RowAction = 'insert-above' | 'insert-below' | 'duplicate' | 'copy' | 'clear' | 'delete'
