import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataFilterControls from './DataFilterControls.svelte'
import InfiniteRows from './InfiniteRows.svelte'
import MasonryFixture from './MasonryFixture.svelte'
import MediaWorkspace from './MediaWorkspace.svelte'
import WorkbenchFixture from './WorkbenchFixture.svelte'
import WorkspaceGridFixture from './WorkspaceGridFixture.svelte'

afterEach(() => vi.unstubAllGlobals())

describe('Svelte table companions', () => {
  it('emits typed filter and sort intent while the host owns the model', async () => {
    const onFilterModelChange = vi.fn()
    const onSortingChange = vi.fn()
    render(DataFilterControls, {
      fields: [
        { id: 'genre', label: 'Genre', type: 'select', options: [{ value: 'dnb', label: 'Drum & Bass' }], sortable: true },
        { id: 'bpm', label: 'BPM', type: 'number', sortable: true },
      ],
      filterModel: { items: [] }, onFilterModelChange, sorting: [], onSortingChange,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Add filter' }))
    await fireEvent.change(screen.getByRole('combobox', { name: 'Filter value' }), { target: { value: 'dnb' } })
    await fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }))
    expect(onFilterModelChange).toHaveBeenCalledWith({ items: [expect.objectContaining({
      field: 'genre', operator: 'contains', value: 'dnb', displayValue: 'Drum & Bass',
    })] })
    expect(screen.queryByRole('button', { name: /Remove Genre/ })).toBeNull()
    await fireEvent.change(screen.getByRole('combobox', { name: 'Sort results' }), { target: { value: 'bpm' } })
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'bpm', desc: false }])
  })

  it('arms the infinite sentinel once per load key and distinguishes end state', async () => {
    const callbacks: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = []
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) { callbacks.push(callback) }
      observe() {}
      disconnect() {}
    })
    const onLoadMore = vi.fn()
    const { rerender } = render(InfiniteRows, { hasMore: true, onLoadMore, rearmKey: 0 })
    await waitFor(() => expect(callbacks.length).toBeGreaterThan(0))
    callbacks.at(-1)!([{ isIntersecting: true }])
    callbacks.at(-1)!([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    await rerender({ hasMore: true, onLoadMore, rearmKey: 1 })
    callbacks.at(-1)!([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalledTimes(2)
    await rerender({ hasMore: false, onLoadMore })
    expect(screen.getByText('End of results')).toBeInTheDocument()
  })

  it('keeps masonry DOM order and stable row ids', () => {
    render(MasonryFixture, { rows: [{ id: 'a', title: 'First' }, { id: 'b', title: 'Second' }] })
    expect(screen.getByRole('list', { name: 'Albums' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['First', 'Second'])
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-row-id'))).toEqual(['a', 'b'])
  })

  it('places masonry items from its container width', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
    render(MasonryFixture, { rows: [{ id: 'a', title: 'First' }, { id: 'b', title: 'Second' }] })
    await waitFor(() => expect(screen.getAllByRole('listitem')[1]).toHaveStyle({ transform: 'translate(356px, 0px)' }))
  })

  it('chooses workspace grid breakpoint from container width and emits controlled move intent', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 700 } as DOMRect)
    const document = { id: 'work', revision: '1', layouts: { sm: [{ id: 'metric', x: 0, y: 0, w: 2, h: 2 }] } }
    const onDocumentChange = vi.fn()
    const { container } = render(WorkspaceGridFixture, { document, onDocumentChange })
    await waitFor(() => expect(container.querySelector('[data-tint-workspace-grid]')).toHaveAttribute('data-breakpoint', 'sm'))
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Workspace item metric' }), { key: 'ArrowRight', altKey: true })
    expect(onDocumentChange).toHaveBeenCalledWith(expect.objectContaining({ revision: '2' }), expect.objectContaining({ type: 'move', x: 1 }))
  })

  it('compacts workspace peers after a move into an occupied cell', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 700 } as DOMRect)
    const document = { id: 'work', revision: '1', layouts: { sm: [
      { id: 'a', x: 0, y: 0, w: 1, h: 1 },
      { id: 'b', x: 1, y: 0, w: 1, h: 1 },
    ] } }
    const onDocumentChange = vi.fn()
    render(WorkspaceGridFixture, { document, onDocumentChange })
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Workspace item a' }), { key: 'ArrowRight', altKey: true })
    expect(onDocumentChange.mock.calls[0]?.[0].layouts.sm).toEqual([
      { id: 'a', x: 1, y: 0, w: 1, h: 1 },
      { id: 'b', x: 1, y: 1, w: 1, h: 1 },
    ])
  })

  it('keeps media search and selection host-controlled', async () => {
    const onQueryChange = vi.fn()
    const onSelectionChange = vi.fn()
    render(MediaWorkspace, {
      title: 'Preview', releases: [
        { id: 'a', title: 'Release One', indexer: 'Alpha', size: '1 GB', peers: '2', age: '1h', score: 90 },
      ], query: '', onQueryChange, selection: [], onSelectionChange,
    })
    await fireEvent.input(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'Alpha' } })
    expect(onQueryChange).toHaveBeenCalledWith('Alpha')
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Select Release One' }))
    expect(onSelectionChange).toHaveBeenCalledWith(['a'])
  })

  it('docks the inspector at container width 1180 and reports tab and pane intent', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200)
    const onInspectorTabChange = vi.fn()
    const onInspectorWidthChange = vi.fn()
    const { container, rerender } = render(WorkbenchFixture, { onInspectorTabChange, onInspectorWidthChange })
    await waitFor(() => expect(container.querySelector('[data-collection-workbench]')).toHaveAttribute('data-inspector', 'right'))
    expect(screen.getByText('Details for Allen Mock')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('tab', { name: 'History' }))
    expect(onInspectorTabChange).toHaveBeenCalledWith('history')
    expect(screen.getByText('Details for Allen Mock')).toBeInTheDocument()
    await rerender({ inspectorTab: 'history', onInspectorTabChange, onInspectorWidthChange })
    expect(screen.getByText('History for Allen Mock')).toBeInTheDocument()
    await fireEvent.keyDown(screen.getByRole('button', { name: /Inspector width 320 pixels/ }), { key: 'ArrowLeft' })
    expect(onInspectorWidthChange).toHaveBeenCalledWith(328)
  })

  it('moves the inspector below and switches navigation to chips at a narrow container width', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700)
    const { container } = render(WorkbenchFixture)
    await waitFor(() => {
      expect(container.querySelector('[data-collection-workbench]')).toHaveAttribute('data-inspector', 'below')
      expect(container.querySelector('[data-collection-workbench]')).toHaveAttribute('data-navigation', 'chips')
    })
  })
})
