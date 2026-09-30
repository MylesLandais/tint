import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'svelte'
import DataTable from './DataTable.svelte'
import TableColumnsMenu from './TableColumnsMenu.svelte'
import TablePager from './TablePager.svelte'
import type { DataTableProps, TableColumn } from './types'
import type { TableInstance } from '../../../core/table/engine'

type Artist = { id: string; name: string; genre: string; bpm: number; state: string }
const rows: Artist[] = [
  { id: 'a', name: 'Allen Mock', genre: 'House', bpm: 126, state: 'library' },
  { id: 'b', name: 'Centauri', genre: 'Techno', bpm: 132, state: 'wishlist' },
]
const columns: TableColumn<Artist>[] = [
  { id: 'name', header: 'Artist', sortable: true, pinned: true, width: 200, hideable: false },
  { id: 'genre', header: 'Genre' },
  { id: 'bpm', header: 'BPM', type: 'number' },
  { id: 'state', header: 'State' },
]
const ArtistTable = DataTable as Component<DataTableProps<Artist>>
const ArtistColumnsMenu = TableColumnsMenu as Component<{
  columns: readonly TableColumn<Artist>[]
  hiddenColumns: readonly string[]
  onChange: (hidden: readonly string[]) => void
  label?: string
}>

afterEach(() => vi.restoreAllMocks())

describe('Svelte DataTable', () => {
  it('renders a real table with row headers and controlled sort intent', async () => {
    const onSortChange = vi.fn()
    render(ArtistTable, { rows, columns, rowId: 'id', label: 'Artists', rowHeaderColumn: 'name', sort: null, onSortChange })
    const table = screen.getByRole('table', { name: 'Artists' })
    expect(within(table).getByRole('rowheader', { name: /Allen Mock/ })).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Sort by Artist' }))
    expect(onSortChange).toHaveBeenCalledWith({ column: 'name', direction: 'asc' })
    expect(screen.getByRole('columnheader', { name: /Artist/ })).toHaveAttribute('aria-sort', 'none')
  })

  it('keeps row and page selection controlled, including off-page ids', async () => {
    const onSelectionChange = vi.fn()
    render(ArtistTable, { rows, columns, rowId: 'id', selection: ['off-page'], onSelectionChange })
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
    expect(onSelectionChange).toHaveBeenCalledWith({
      selection: ['off-page', 'a', 'b'], rowId: null, selected: true,
    })
    expect(screen.getByRole('checkbox', { name: 'Select Allen Mock' })).not.toBeChecked()
  })

  it('reports query-wide selection and row exceptions without taking ownership', async () => {
    const onSelectionModelChange = vi.fn()
    render(ArtistTable, {
      rows, columns, rowId: 'id',
      selectionModel: { mode: 'query', queryKey: 'genre=House', excludedIds: [] },
      selectionQueryKey: 'genre=House', onSelectionModelChange,
    })
    expect(screen.getByRole('checkbox', { name: 'Select Allen Mock' })).toBeChecked()
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Select Allen Mock' }))
    expect(onSelectionModelChange).toHaveBeenCalledWith({
      mode: 'query', queryKey: 'genre=House', excludedIds: ['a'],
    })
    expect(screen.getByRole('checkbox', { name: 'Select Allen Mock' })).toBeChecked()
  })

  it('uses the measured table container width for progressive column hiding', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700)
    render(ArtistTable, { rows, columns, rowId: 'id', workbenchResponsive: true })
    await waitFor(() => expect(screen.queryByRole('columnheader', { name: 'Genre' })).toBeNull())
    expect(screen.queryByRole('columnheader', { name: 'BPM' })).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'State' })).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'Artist' })).toBeInTheDocument()
  })

  it('virtualizes a long fixed-height result set using stable row ids', async () => {
    const many = Array.from({ length: 1000 }, (_, index) => ({ ...rows[0]!, id: `artist-${index}`, name: `Artist ${index}` }))
    const { container } = render(ArtistTable, { rows: many, columns, rowId: 'id', virtual: true, virtualHeight: 240 })
    await waitFor(() => {
      const rendered = container.querySelectorAll('[data-row-id]')
      expect(rendered.length).toBeGreaterThan(0)
      expect(rendered.length).toBeLessThan(1000)
    })
    expect(container.querySelector('table')).toHaveAttribute('aria-rowcount', '1001')
    expect(container.querySelector('[data-row-id="artist-0"]')).toBeInTheDocument()
  })

  it('accepts the existing plain TanStack v8 table instance path', () => {
    const table = {
      getRowModel: () => ({ rows: rows.map((original) => ({ original })) }),
    } as unknown as TableInstance<Artist>
    render(ArtistTable, { table, columns, rowId: 'id' })
    expect(screen.getByRole('rowheader', { name: 'Allen Mock' })).toBeInTheDocument()
  })

  it('resizes through the keyboard and reports the next controlled width', async () => {
    const onResize = vi.fn()
    const onColumnWidthsChange = vi.fn()
    render(ArtistTable, {
      rows, columns, rowId: 'id', resizing: { columns: true, minColumnWidth: 75 },
      columnWidths: { name: 200 }, onColumnWidthsChange, onResize,
    })
    await fireEvent.keyDown(screen.getByRole('button', { name: /Resize Artist, 200 pixels/ }), { key: 'ArrowRight' })
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ name: 208 })
    expect(onResize).toHaveBeenCalledWith({ axis: 'column', id: 'name', size: 208, phase: 'end' })
  })

  it('commits an inline edit through the framework-neutral command', async () => {
    const update = vi.fn().mockResolvedValue({ ...rows[0], name: 'Renamed' })
    const onCommit = vi.fn()
    const editable = columns.map((column) => column.id === 'name' ? { ...column, editable: true } : column)
    render(ArtistTable, { rows, columns: editable, rowId: 'id', editing: { adapter: { update }, onCommit } })
    await fireEvent.dblClick(screen.getByRole('button', { name: 'Allen Mock' }))
    const input = screen.getByRole('textbox', { name: 'Edit Artist' })
    await fireEvent.input(input, { target: { value: 'Renamed' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith({
      rowId: 'a', column: 'name', value: 'Renamed', row: { ...rows[0], name: 'Renamed' },
    }))
  })
})

describe('Svelte table chrome', () => {
  it('keeps the columns menu controlled and protects the last visible column', async () => {
    const onChange = vi.fn()
    render(ArtistColumnsMenu, { columns, hiddenColumns: ['genre', 'bpm', 'state'], onChange })
    await fireEvent.click(screen.getByRole('button', { name: /Columns/ }))
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Artist' })).toBeNull()
    const state = screen.getByRole('menuitemcheckbox', { name: 'State' })
    expect(state).toHaveAttribute('aria-checked', 'false')
    await fireEvent.click(state)
    expect(onChange).toHaveBeenCalledWith(['genre', 'bpm'])
  })

  it('moves through column menu items with the keyboard and returns focus on Escape', async () => {
    render(ArtistColumnsMenu, { columns, hiddenColumns: [], onChange: vi.fn() })
    const trigger = screen.getByRole('button', { name: 'Columns' })
    await fireEvent.click(trigger)
    const menu = screen.getByRole('menu', { name: 'Columns' })
    expect(screen.getByRole('menuitemcheckbox', { name: 'Genre' })).toHaveFocus()
    await fireEvent.keyDown(menu, { key: 'End' })
    expect(screen.getByRole('menuitemcheckbox', { name: 'State' })).toHaveFocus()
    await fireEvent.keyDown(menu, { key: 'Escape' })
    expect(menu).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('clamps pager bounds and announces an empty result', async () => {
    const onChange = vi.fn()
    const { rerender } = render(TablePager, { page: 6, pageSize: 15, total: 93, onChange })
    expect(screen.getByText('91–93 of 93')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await rerender({ page: 0, pageSize: 15, total: 0, onChange })
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })
})
