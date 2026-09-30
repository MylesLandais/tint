import { getCellValue } from './derive'
import type { TableColumnCore, TableEditAdapter, TableEditCommit, TableRowId } from './types'

export function normalizeTableError(error: unknown, message: string): Error {
  return error instanceof Error ? error : new Error(message)
}

/** Adapter calls stay outside the Svelte renderer; hosts apply returned rows. */
export async function createTableRow<TRow>(
  create: NonNullable<TableEditAdapter<TRow>['create']>,
  columnIds: readonly string[],
): Promise<TRow> {
  try {
    return await create(Object.fromEntries(columnIds.map((id) => [id, ''])) as Partial<TRow>)
  } catch (error) {
    throw normalizeTableError(error, 'Unable to create row')
  }
}

export type TableCellUpdate<TRow> =
  | { changed: false }
  | { changed: true; commit: TableEditCommit<TRow> }

export async function updateTableCell<TRow>(
  update: NonNullable<TableEditAdapter<TRow>['update']>,
  rowId: TableRowId,
  row: TRow,
  column: TableColumnCore<TRow>,
  draft: string,
): Promise<TableCellUpdate<TRow>> {
  const previous = getCellValue(row, column)
  const value = column.parseEditValue ? column.parseEditValue(draft, previous, row) : draft
  if (String(value) === String(previous ?? '')) return { changed: false }
  try {
    const saved = await update(rowId, { [column.id]: value } as Partial<TRow>)
    return { changed: true, commit: { rowId, column: column.id, value, row: saved } }
  } catch (error) {
    throw normalizeTableError(error, 'Unable to update row')
  }
}

export async function deleteTableRow<TRow>(
  remove: NonNullable<TableEditAdapter<TRow>['delete']>,
  rowId: TableRowId,
): Promise<void> {
  try {
    await remove(rowId)
  } catch (error) {
    throw normalizeTableError(error, 'Unable to delete row')
  }
}
