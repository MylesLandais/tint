import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import type { Component } from 'svelte'
import { createView, type FieldDef } from '../../../core/table'
import { createDatasetStore } from './datasetStore.svelte'
import DatasetEditorView from './DatasetEditor.svelte'
import DatasetGridView from './DatasetGrid.svelte'
import type { DatasetStore } from './datasetStore.svelte'
import type { DatasetGridProps } from './datasetTypes'

const DatasetEditor = DatasetEditorView as unknown as Component<{ store: DatasetStore<Book>; label: string; height?: number }>
const DatasetGrid = DatasetGridView as unknown as Component<DatasetGridProps<Book>>

type Book = { id: string; title: string; pages: number | null; owned: boolean; tags: string[]; status: string | null; rating: number | null }
const fields: FieldDef[] = [
  { id: 'title', name: 'Title', type: 'text' },
  { id: 'pages', name: 'Pages', type: 'number' },
  { id: 'owned', name: 'Owned', type: 'checkbox' },
  { id: 'tags', name: 'Tags', type: 'multi-select', options: [{ value: 'x' }, { value: 'y' }, { value: 'z' }] },
  { id: 'status', name: 'Status', type: 'select', options: [{ value: 'Open' }, { value: 'Done' }] },
  { id: 'rating', name: 'Rating', type: 'rating' },
]
const rows = (): Book[] => [
  { id: 'a', title: 'Alpha', pages: 100, owned: false, tags: ['x'], status: 'Open', rating: null },
  { id: 'b', title: 'Beta', pages: null, owned: true, tags: [], status: null, rating: 3 },
  { id: 'c', title: 'Gamma', pages: 30, owned: false, tags: ['y', 'z'], status: 'Done', rating: null },
]
const mount = () => {
  const store = createDatasetStore<Book>({ fields, rows: rows(), views: [createView('all', 'All')] })
  render(DatasetEditor, { store, label: 'Books', height: 300 })
  return { store, grid: screen.getByRole('grid', { name: 'Books' }) }
}
const cell = (grid: HTMLElement, r: number, c: number) => grid.querySelector<HTMLElement>(`[id$="-r${r}c${c}"]`)!

describe('DatasetEditor', () => {
  it('exposes a grid with typed cells and a primary field', () => {
    const { grid } = mount()
    expect(grid).toHaveAttribute('aria-rowcount', '4')
    expect(within(grid).getAllByRole('columnheader').map((h) => h.textContent?.trim()).join(' ')).toContain('Title')
    expect(cell(grid, 1, 1)).toHaveTextContent('')
    expect(within(cell(grid, 0, 2)).getByRole('img', { name: 'Unchecked' })).toBeInTheDocument()
  })

  it('moves the active cell with the keyboard and tracks it via aria-activedescendant', async () => {
    const { grid } = mount()
    await fireEvent.pointerDown(cell(grid, 0, 0), { button: 0 })
    await fireEvent.keyDown(grid, { key: 'ArrowDown' })
    await fireEvent.keyDown(grid, { key: 'ArrowRight' })
    expect(grid.getAttribute('aria-activedescendant')).toBe(cell(grid, 1, 1).id)
  })

  it('edits by typing, commits with Enter, and undoes', async () => {
    const { grid, store } = mount()
    await fireEvent.pointerDown(cell(grid, 0, 0), { button: 0 })
    await fireEvent.keyDown(grid, { key: 'Z' })
    const input = await screen.findByRole('textbox', { name: /Title for Alpha/ })
    expect(input).toHaveValue('Z')
    await fireEvent.input(input, { target: { value: 'Zeta' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(store.rows[0].title).toBe('Zeta')
    expect(store.canUndo).toBe(true)
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows[0].title).toBe('Alpha')
    expect(store.canRedo).toBe(true)
  })

  it('blocks an invalid number and reports it accessibly', async () => {
    const { grid, store } = mount()
    await fireEvent.pointerDown(cell(grid, 0, 1), { button: 0 })
    await fireEvent.keyDown(grid, { key: 'Enter' })
    const input = await screen.findByRole('textbox', { name: /Pages for Alpha/ })
    await fireEvent.input(input, { target: { value: 'many' } })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number')
    expect(store.rows[0].pages).toBe(100)
    await fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('textbox', { name: /Pages for/ })).toBeNull()
  })

  it('toggles a checkbox with Space, clears a range with Delete, and pastes a block', async () => {
    const { grid, store } = mount()
    await fireEvent.pointerDown(cell(grid, 0, 2), { button: 0 })
    await fireEvent.keyDown(grid, { key: ' ' })
    expect(store.rows[0].owned).toBe(true)

    await fireEvent.pointerDown(cell(grid, 0, 1), { button: 0 })
    await fireEvent.keyDown(grid, { key: 'ArrowDown', shiftKey: true })
    await fireEvent.keyDown(grid, { key: 'Delete' })
    expect([store.rows[0].pages, store.rows[1].pages]).toEqual([null, null])
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows[0].pages).toBe(100)

    await fireEvent.pointerDown(cell(grid, 1, 0), { button: 0 })
    await fireEvent.paste(grid, { clipboardData: { getData: () => 'One\t11\nTwo\tnope' } })
    expect(store.rows[1]).toMatchObject({ title: 'One', pages: 11 })
    expect(store.rows[2]).toMatchObject({ title: 'Two', pages: 30 }) // invalid number skipped
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows[1].title).toBe('Beta') // paste is one undo step
  })

  it('applies a view sort from the field menu and groups via the view bar', async () => {
    const { store } = mount()
    await fireEvent.click(screen.getByRole('button', { name: /Pages/ }))
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Sort Z → A' }))
    expect(store.activeView.sorts).toEqual([{ field: 'pages', desc: true }])
    const grid = screen.getByRole('grid', { name: 'Books' })
    // Blank pages stay last when sorted descending.
    expect(cell(grid, 0, 0)).toHaveTextContent('Alpha')
    expect(cell(grid, 2, 0)).toHaveTextContent('Beta')
  })

  it('opens the record panel with Shift+Space and edits through it', async () => {
    const { grid, store } = mount()
    await fireEvent.pointerDown(cell(grid, 2, 0), { button: 0 })
    await fireEvent.keyDown(grid, { key: ' ', shiftKey: true })
    const panel = await screen.findByRole('complementary', { name: 'Record: Gamma' })
    const title = within(panel).getByLabelText(/Title/)
    await fireEvent.input(title, { target: { value: 'Gamma II' } })
    await fireEvent.blur(title)
    expect(store.rows[2].title).toBe('Gamma II')
  })

  it('is read-only on request', async () => {
    const { grid } = (() => {
      render(DatasetGrid, { fields, rows: rows(), view: createView('all', 'All'), label: 'RO', readOnly: true })
      return { grid: screen.getByRole('grid', { name: 'RO' }) }
    })()
    await fireEvent.pointerDown(cell(grid, 0, 0), { button: 0 })
    await fireEvent.keyDown(grid, { key: 'Enter' })
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add field' })).toBeNull()
  })

  /** A real mouse click: pointerdown selects, then the click event fires. */
  const click = async (el: HTMLElement) => { await fireEvent.pointerDown(el, { button: 0 }); await fireEvent.click(el) }

  it('click selects, clicking the active cell again opens the editor', async () => {
    const { grid } = mount()
    await click(cell(grid, 1, 0))
    expect(screen.queryByRole('textbox', { name: /Title for/ })).toBeNull()
    await click(cell(grid, 1, 0))
    expect(await screen.findByRole('textbox', { name: /Title for Beta/ })).toHaveFocus()
  })

  it('a first click on an unrelated cell never opens an editor', async () => {
    const { grid } = mount()
    await click(cell(grid, 0, 0))
    await click(cell(grid, 1, 1))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('a select cell opens a themed chip popover on the second click and commits a choice', async () => {
    const { grid, store } = mount()
    await click(cell(grid, 0, 4))
    expect(screen.queryByRole('listbox')).toBeNull()
    await click(cell(grid, 0, 4))
    const list = await screen.findByRole('listbox')
    expect(within(list).getAllByRole('option').map((o) => o.textContent?.replace(/[✓\s]+/g, ''))).toEqual(['Open', 'Done'])
    await fireEvent.click(within(list).getByRole('option', { name: /Done/ }))
    expect(store.rows[0].status).toBe('Done')
    expect(screen.queryByRole('listbox')).toBeNull()
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows[0].status).toBe('Open')
  })

  it('creates a new option from the popover search and adds it to the schema in one undo step', async () => {
    const { grid, store } = mount()
    await click(cell(grid, 0, 4))
    await fireEvent.keyDown(grid, { key: 'Enter' })
    const search = await screen.findByRole('combobox', { name: /Status for Alpha/ })
    await fireEvent.input(search, { target: { value: 'Blocked' } })
    await fireEvent.click(screen.getByRole('option', { name: /Create .Blocked./ }))
    expect(store.rows[0].status).toBe('Blocked')
    expect(store.fields.find((f) => f.id === 'status')?.options?.map((o) => o.value)).toContain('Blocked')
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows[0].status).toBe('Open')
    expect(store.fields.find((f) => f.id === 'status')?.options?.map((o) => o.value)).not.toContain('Blocked')
  })

  it('a multi-select popover stages toggles and commits them on Escape', async () => {
    const { grid, store } = mount()
    await click(cell(grid, 0, 3))
    await click(cell(grid, 0, 3))
    const search = await screen.findByRole('combobox', { name: /Tags for Alpha/ })
    await fireEvent.click(screen.getByRole('option', { name: /y/ }))
    expect(store.rows[0].tags).toEqual(['x']) // staged, not yet committed
    await fireEvent.keyDown(search, { key: 'Escape' })
    expect(store.rows[0].tags).toEqual(['x', 'y'])
  })

  it('clicking a star sets the rating and clicking it again clears it', async () => {
    const { grid, store } = mount()
    const star = (n: number) => cell(grid, 0, 5).querySelector<HTMLElement>(`[data-star="${n}"]`)!
    await click(star(4))
    expect(store.rows[0].rating).toBe(4)
    await click(star(4))
    expect(store.rows[0].rating).toBe(null)
  })

  it('right-click opens the record menu; Duplicate and Delete are undoable', async () => {
    const { grid, store } = mount()
    await fireEvent.contextMenu(cell(grid, 1, 0))
    const menu = await screen.findByRole('menu', { name: 'Record actions' })
    await fireEvent.click(within(menu).getByRole('menuitem', { name: /Duplicate record/ }))
    expect(store.rows.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Beta', 'Gamma'])
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows).toHaveLength(3)

    await fireEvent.contextMenu(cell(grid, 0, 0))
    await fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Delete record/ }))
    expect(store.rows.map((r) => r.title)).toEqual(['Beta', 'Gamma'])
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('deleting a multi-row range undoes back to the original order', async () => {
    const { grid, store } = mount()
    await click(cell(grid, 0, 0))
    await fireEvent.keyDown(grid, { key: 'ArrowDown', shiftKey: true, ctrlKey: true })
    await fireEvent.contextMenu(cell(grid, 1, 0))
    await fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Delete 3 records/ }))
    expect(store.rows).toHaveLength(0)
    await fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(store.rows.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('Tab past the last cell adds a record and starts editing it; the in-grid row does too', async () => {
    const { grid, store } = mount()
    await click(cell(grid, 2, 5))
    await fireEvent.keyDown(grid, { key: 'Tab' })
    expect(store.rows).toHaveLength(4)
    expect(await screen.findByRole('textbox', { name: /Title for/ })).toBeInTheDocument()
    await fireEvent.keyDown(screen.getByRole('textbox', { name: /Title for/ }), { key: 'Escape' })
    await fireEvent.click(screen.getByRole('button', { name: 'Add record' }))
    expect(store.rows).toHaveLength(5)
  })

  it('read-only grids ignore clicks that would edit', async () => {
    render(DatasetGrid, { fields, rows: rows(), view: createView('all', 'All'), label: 'RO2', readOnly: true })
    const grid = screen.getByRole('grid', { name: 'RO2' })
    await click(cell(grid, 0, 4))
    await click(cell(grid, 0, 4))
    expect(screen.queryByRole('listbox')).toBeNull()
    await fireEvent.contextMenu(cell(grid, 0, 0))
    expect(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Delete record/ })).toBeDisabled()
  })
})
