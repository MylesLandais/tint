import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'
import { TableColumnsMenu, TablePager } from './TableChrome'
import type { TableColumn } from './types'

type Artist = {
  id: string
  name: string
  tracks: number
  releases: number
  state: 'unreviewed' | 'wishlist' | 'library'
}

const artists: Artist[] = [
  { id: 'allen-mock', name: 'Allen Mock', tracks: 10, releases: 30, state: 'unreviewed' },
  { id: 'centauri', name: 'Centauri', tracks: 9, releases: 12, state: 'wishlist' },
  { id: 'akasha', name: 'Akasha Experience', tracks: 6, releases: 9, state: 'library' },
]

const columns: TableColumn<Artist>[] = [
  { id: 'name', header: 'Artist', sortable: true, pinned: true, width: 200, hideable: false },
  { id: 'tracks', header: 'Tracks', type: 'number', sortable: true },
  { id: 'releases', header: 'Releases', type: 'number', sortable: true },
  { id: 'state', header: 'State' },
]

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Artist>>> = {}) {
  return render(
    <DataTable
      rows={artists}
      columns={columns}
      rowId="id"
      label="Artists"
      rowHeaderColumn="name"
      {...props}
    />,
  )
}

describe('DataTable semantics', () => {
  it('renders a real accessible table with row headers', () => {
    renderTable()

    expect(screen.getByRole('table', { name: 'Artists' })).toBeInTheDocument()
    const row = screen.getByRole('row', { name: /Allen Mock/ })
    expect(within(row).getByText('30')).toBeInTheDocument()
    // The identifying cell is a header so a reader hears "Allen Mock, 30".
    expect(within(row).getByRole('rowheader')).toHaveTextContent('Allen Mock')
  })

  it('does not claim a grid role it has not implemented', () => {
    const { container } = renderTable()
    // role="grid" promises arrow-key cell navigation. Announcing it without
    // implementing it leaves a screen-reader user pressing keys that do nothing.
    expect(container.querySelector('[role="grid"]')).toBeNull()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('exposes sort state through aria-sort on sortable headers only', () => {
    renderTable({ sort: { column: 'tracks', direction: 'desc' }, onSortChange: vi.fn() })

    expect(screen.getByRole('columnheader', { name: /Tracks/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(screen.getByRole('columnheader', { name: /Releases/ })).toHaveAttribute(
      'aria-sort',
      'none',
    )
    // A column that cannot be sorted must not advertise a sort state at all.
    expect(screen.getByRole('columnheader', { name: 'State' })).not.toHaveAttribute(
      'aria-sort',
    )
  })

  it('makes sort headers real buttons, not click handlers on a th', () => {
    const onSortChange = vi.fn()
    renderTable({ sort: null, onSortChange })

    const button = screen.getByRole('button', { name: 'Sort by Tracks' })
    button.focus()
    expect(button).toHaveFocus()

    fireEvent.click(button)
    expect(onSortChange).toHaveBeenCalledWith({ column: 'tracks', direction: 'asc' })
  })

  it('cycles a header through asc, desc, and back to unsorted', () => {
    const onSortChange = vi.fn()
    const { rerender } = renderTable({ sort: null, onSortChange })

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Releases' }))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'releases', direction: 'asc' })

    rerender(
      <DataTable
        rows={artists}
        columns={columns}
        rowId="id"
        label="Artists"
        sort={{ column: 'releases', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Releases, sorted ascending/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'releases', direction: 'desc' })

    rerender(
      <DataTable
        rows={artists}
        columns={columns}
        rowId="id"
        label="Artists"
        sort={{ column: 'releases', direction: 'desc' }}
        onSortChange={onSortChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Releases, sorted descending/ }))
    expect(onSortChange).toHaveBeenLastCalledWith(null)
  })

  it('renders the supplied empty state', () => {
    renderTable({ rows: [], emptyState: <p>No artists match this view.</p> })
    expect(screen.getByText('No artists match this view.')).toBeInTheDocument()
  })
})

describe('DataTable selection', () => {
  it('reports the next selection without owning it', () => {
    const onSelectionChange = vi.fn()
    renderTable({ selection: [], onSelectionChange })

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Allen Mock' }))

    expect(onSelectionChange).toHaveBeenCalledWith({
      selection: ['allen-mock'],
      rowId: 'allen-mock',
      selected: true,
    })
    // Controlled: nothing changes until the caller passes the new value back.
    expect(screen.getByRole('checkbox', { name: 'Select Allen Mock' })).not.toBeChecked()
  })

  it('deselects a row that was already selected', () => {
    const onSelectionChange = vi.fn()
    renderTable({ selection: ['allen-mock', 'centauri'], onSelectionChange })

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Allen Mock' }))
    expect(onSelectionChange).toHaveBeenCalledWith({
      selection: ['centauri'],
      rowId: 'allen-mock',
      selected: false,
    })
  })

  it('selects and clears every visible row', () => {
    const onSelectionChange = vi.fn()
    const { rerender } = renderTable({ selection: [], onSelectionChange })

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      selection: ['allen-mock', 'centauri', 'akasha'],
      rowId: null,
      selected: true,
    })

    rerender(
      <DataTable
        rows={artists}
        columns={columns}
        rowId="id"
        label="Artists"
        selection={['allen-mock', 'centauri', 'akasha']}
        onSelectionChange={onSelectionChange}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      selection: [],
      rowId: null,
      selected: false,
    })
  })

  it('leaves rows selected that are not currently visible', () => {
    const onSelectionChange = vi.fn()
    // Someone off this page is already selected; select-all must not drop them.
    render(
      <DataTable
        rows={[artists[0]!]}
        columns={columns}
        rowId="id"
        label="Artists"
        selection={['off-page']}
        onSelectionChange={onSelectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      selection: ['off-page', 'allen-mock'],
      rowId: null,
      selected: true,
    })
  })

  it('omits selection entirely when no handler is supplied', () => {
    renderTable()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})

describe('DataTable expansion', () => {
  const expansionProps = {
    expanded: [] as readonly string[],
    onExpandedChange: vi.fn(),
    renderExpanded: (artist: Artist) => <p>{artist.name} detail</p>,
  }

  it('reports an expand request', () => {
    const onExpandedChange = vi.fn()
    renderTable({ ...expansionProps, onExpandedChange })

    const toggle = screen.getByRole('button', { name: 'Expand Allen Mock' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(onExpandedChange).toHaveBeenCalledWith(['allen-mock'], 'allen-mock')
  })

  it('renders the detail row for an expanded row', () => {
    renderTable({ ...expansionProps, expanded: ['centauri'] })

    expect(screen.getByText('Centauri detail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Centauri' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.queryByText('Allen Mock detail')).toBeNull()
  })

  it('shows a notice rather than an empty region when there is no detail', () => {
    renderTable({
      ...expansionProps,
      expanded: ['centauri'],
      renderExpanded: () => null,
    })
    expect(screen.getByText('Nothing to show here.')).toBeInTheDocument()
  })
})

describe('TableColumnsMenu', () => {
  it('toggles a column and reports the next hidden set', () => {
    const onChange = vi.fn()
    render(
      <TableColumnsMenu columns={columns} hiddenColumns={[]} onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Columns/ }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Tracks' }))
    expect(onChange).toHaveBeenCalledWith(['tracks'])
  })

  it('leaves a hideable:false column out of the menu', () => {
    render(<TableColumnsMenu columns={columns} hiddenColumns={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }))

    expect(screen.getByRole('menuitemcheckbox', { name: 'Tracks' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Artist' })).toBeNull()
  })

  it('refuses to hide the last visible column', () => {
    const onChange = vi.fn()
    // Only 'state' is left showing; hiding it would leave an empty grid.
    render(
      <TableColumnsMenu
        columns={columns}
        hiddenColumns={['name', 'tracks', 'releases']}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }))

    const last = screen.getByRole('menuitemcheckbox', { name: 'State' })
    expect(last).toBeDisabled()
    fireEvent.click(last)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('hides the columns it is told to hide', () => {
    renderTable({ hiddenColumns: ['releases'] })
    expect(screen.queryByRole('columnheader', { name: /Releases/ })).toBeNull()
    expect(screen.getByRole('columnheader', { name: /Tracks/ })).toBeInTheDocument()
  })
})

describe('TablePager', () => {
  it('describes the visible range and clamps the ends', () => {
    const onChange = vi.fn()
    render(<TablePager page={0} pageSize={15} total={93} onChange={onChange} />)

    expect(screen.getByText('1–15 of 93')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('does not run past the final page', () => {
    render(<TablePager page={6} pageSize={15} total={93} onChange={vi.fn()} />)
    expect(screen.getByText('91–93 of 93')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('reports no rows rather than a nonsense range', () => {
    render(<TablePager page={0} pageSize={15} total={0} onChange={vi.fn()} />)
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })
})

describe('useTableView', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists hidden columns under the view key', async () => {
    const { useTableView } = await import('./useTableView')
    const { renderHook, act } = await import('@testing-library/react')

    const { result } = renderHook(() => useTableView('tint.test.view'))
    act(() => result.current.setHiddenColumns(['tracks']))

    expect(result.current.hiddenColumns).toEqual(['tracks'])
    expect(JSON.parse(window.localStorage.getItem('tint.test.view')!)).toMatchObject({
      hiddenColumns: ['tracks'],
    })
  })

  it('restores a stored view on mount and resets back to the defaults', async () => {
    const { useTableView } = await import('./useTableView')
    const { renderHook, act } = await import('@testing-library/react')

    window.localStorage.setItem(
      'tint.test.view',
      JSON.stringify({ hiddenColumns: ['releases'], pinnedColumns: [] }),
    )
    const { result } = renderHook(() =>
      useTableView('tint.test.view', { hiddenColumns: ['state'] }),
    )
    expect(result.current.hiddenColumns).toEqual(['releases'])

    act(() => result.current.reset())
    expect(result.current.hiddenColumns).toEqual(['state'])
  })

  it('falls back to component state when storage is corrupt or absent', async () => {
    const { useTableView } = await import('./useTableView')
    const { renderHook } = await import('@testing-library/react')

    window.localStorage.setItem('tint.test.view', 'not json')
    const stored = renderHook(() =>
      useTableView('tint.test.view', { hiddenColumns: ['state'] }),
    )
    expect(stored.result.current.hiddenColumns).toEqual(['state'])

    const unkeyed = renderHook(() => useTableView(undefined))
    expect(unkeyed.result.current.hiddenColumns).toEqual([])
  })
})
