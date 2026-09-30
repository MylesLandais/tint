import type { TableRowId, TableSelectionChange } from './types'

/** Query mode represents every matching row, including rows outside the current page. */
export type TableSelectionModel =
  | { mode: 'ids'; ids: readonly TableRowId[] }
  | { mode: 'query'; queryKey: string; excludedIds: readonly TableRowId[] }

export function isRowSelected(selection: TableSelectionModel, rowId: TableRowId): boolean {
  return selection.mode === 'query'
    ? !selection.excludedIds.includes(rowId)
    : selection.ids.includes(rowId)
}

export function toggleRowSelection(
  selection: TableSelectionModel,
  rowId: TableRowId,
): TableSelectionModel {
  const selected = isRowSelected(selection, rowId)
  if (selection.mode === 'query') {
    return {
      ...selection,
      excludedIds: selected
        ? [...selection.excludedIds, rowId]
        : selection.excludedIds.filter((id) => id !== rowId),
    }
  }
  return {
    mode: 'ids',
    ids: selected ? selection.ids.filter((id) => id !== rowId) : [...selection.ids, rowId],
  }
}

/** Toggles only visible rows; existing off-page selections remain intact. */
export function toggleVisibleSelection(
  selection: TableSelectionModel,
  visibleIds: readonly TableRowId[],
): TableSelectionModel {
  const unique = [...new Set(visibleIds)]
  const allSelected = unique.length > 0 && unique.every((id) => isRowSelected(selection, id))
  const visible = new Set(unique)
  if (selection.mode === 'query') {
    return {
      ...selection,
      excludedIds: allSelected
        ? [...new Set([...selection.excludedIds, ...unique])]
        : selection.excludedIds.filter((id) => !visible.has(id)),
    }
  }
  return {
    mode: 'ids',
    ids: allSelected
      ? selection.ids.filter((id) => !visible.has(id))
      : [...selection.ids, ...unique.filter((id) => !selection.ids.includes(id))],
  }
}

export function selectMatchingQuery(queryKey: string): TableSelectionModel {
  return { mode: 'query', queryKey, excludedIds: [] }
}

export function selectedCount(selection: TableSelectionModel, matchingTotal: number): number {
  return selection.mode === 'query'
    ? Math.max(0, matchingTotal - selection.excludedIds.length)
    : selection.ids.length
}

/** Legacy visible-row selection event retained for the controlled React contract. */
export function toSelectionChange(
  selection: readonly TableRowId[],
  visibleIds: readonly TableRowId[],
  rowId: TableRowId | null,
): TableSelectionChange {
  const model = { mode: 'ids', ids: selection } as const
  const next = rowId === null
    ? toggleVisibleSelection(model, visibleIds)
    : toggleRowSelection(model, rowId)
  const selected = rowId === null
    ? visibleIds.some((id) => !selection.includes(id))
    : !selection.includes(rowId)
  return { selection: next.mode === 'ids' ? next.ids : selection, rowId, selected }
}
