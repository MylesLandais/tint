import { describe, expect, it } from 'vitest'
import { matchingQueryKey, parseTableQuery, serializeTableQuery, type TableQueryState } from './query'
import {
  isRowSelected,
  selectMatchingQuery,
  selectedCount,
  toggleRowSelection,
  toggleVisibleSelection,
  toSelectionChange,
} from './selection'
import { workbenchLayout } from './layout'
import { createTableRow, deleteTableRow, updateTableCell } from './commands'
import { vi } from 'vitest'

const query: TableQueryState = {
  filters: { items: [{ id: 'genre-1', field: 'genre', operator: 'equals', value: 'D&B', displayValue: 'Drum & Bass' }] },
  sorting: [{ id: 'bpm', desc: true }],
  page: { index: 2, size: 25 },
}

describe('table query', () => {
  it('round-trips opaque filter values and paging through a URL parameter string', () => {
    const encoded = serializeTableQuery(query)
    expect(parseTableQuery(`?${encoded}`, query)).toEqual(query)
  })

  it('drops invalid filter entries and falls back on invalid paging', () => {
    const parsed = parseTableQuery('filter=%5B%22bad%22%5D&page=-4&size=0', query)
    expect(parsed.filters.items).toEqual([])
    expect(parsed.page).toEqual(query.page)
  })

  it('keeps a query-wide selection key across page and sort changes', () => {
    const otherPage: TableQueryState = {
      ...query, sorting: [], page: { index: 10, size: 5 },
    }
    expect(matchingQueryKey(query)).toBe(matchingQueryKey(otherPage))
    expect(matchingQueryKey(query)).not.toBe(matchingQueryKey({ filters: { items: [] } }))
    expect(matchingQueryKey({ filters: { items: [
      { id: 'b', field: 'bpm', operator: 'gte', value: 120 },
      ...query.filters.items,
    ] } })).toBe(matchingQueryKey({ filters: { items: [
      ...query.filters.items,
      { id: 'b', field: 'bpm', operator: 'gte', value: 120 },
    ] } }))
  })
})

describe('table selection', () => {
  it('keeps off-page ids when toggling the visible page', () => {
    const next = toggleVisibleSelection({ mode: 'ids', ids: ['off-page'] }, ['a', 'b'])
    expect(next).toEqual({ mode: 'ids', ids: ['off-page', 'a', 'b'] })
    expect(toggleVisibleSelection(next, ['a', 'b'])).toEqual({ mode: 'ids', ids: ['off-page'] })
    expect(toSelectionChange(['off-page'], ['a', 'b'], null)).toEqual({
      selection: ['off-page', 'a', 'b'], rowId: null, selected: true,
    })
  })

  it('selects a whole query while allowing explicit row exceptions', () => {
    const all = selectMatchingQuery('genre=ambient')
    const exceptOne = toggleRowSelection(all, 'row-5')
    expect(isRowSelected(exceptOne, 'row-5')).toBe(false)
    expect(isRowSelected(exceptOne, 'row-9')).toBe(true)
    expect(selectedCount(exceptOne, 100)).toBe(99)
    expect(toggleRowSelection(exceptOne, 'row-5')).toEqual(all)
  })

  it('deduplicates visible ids and preserves query exceptions outside the page', () => {
    const model = { mode: 'query', queryKey: 'q', excludedIds: ['off-page'] } as const
    expect(toggleVisibleSelection(model, ['a', 'a', 'b'])).toEqual({
      mode: 'query', queryKey: 'q', excludedIds: ['off-page', 'a', 'b'],
    })
  })
})

describe('workbench container layout', () => {
  it('docks the inspector at 1180, chips the nav at 720, and hides columns in order', () => {
    expect(workbenchLayout(1180, 1100).inspector).toBe('right')
    expect(workbenchLayout(1179, 1100).inspector).toBe('below')
    expect(workbenchLayout(720).navigation).toBe('chips')
    expect(workbenchLayout(1100, 970).hiddenColumns).toEqual(['genre'])
    expect(workbenchLayout(1100, 820).hiddenColumns).toEqual(['genre', 'bpm'])
    expect(workbenchLayout(1100, 700).hiddenColumns).toEqual(['genre', 'bpm', 'state'])
  })
})

describe('table edit commands', () => {
  it('creates a blank row through the adapter and returns the saved value', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'new', title: '' })
    await expect(createTableRow(create, ['title'])).resolves.toEqual({ id: 'new', title: '' })
    expect(create).toHaveBeenCalledWith({ title: '' })
  })

  it('parses an edit, skips unchanged values, and returns the committed row', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'a', bpm: 130 })
    const row = { id: 'a', bpm: 126 }
    const column = { id: 'bpm', parseEditValue: (draft: string) => Number(draft) }
    await expect(updateTableCell(update, 'a', row, column, '126')).resolves.toEqual({ changed: false })
    expect(update).not.toHaveBeenCalled()
    await expect(updateTableCell(update, 'a', row, column, '130')).resolves.toEqual({
      changed: true, commit: { rowId: 'a', column: 'bpm', value: 130, row: { id: 'a', bpm: 130 } },
    })
    expect(update).toHaveBeenCalledWith('a', { bpm: 130 })
  })

  it('normalizes non-Error adapter failures', async () => {
    const remove = vi.fn().mockRejectedValue('offline')
    await expect(deleteTableRow(remove, 'a')).rejects.toThrow('Unable to delete row')
  })
})
