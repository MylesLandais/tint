import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import TreeView from './TreeView.svelte'

const nodes = [
  {
    id: 'album', label: 'Album', trailing: '2 files',
    children: [
      { id: 'track-a', label: 'Track A' },
      { id: 'track-b', label: 'Track B' },
    ],
  },
  { id: 'other', label: 'Other' },
]

describe('TreeView', () => {
  it('reports expansion and checkbox selection while the host owns both values', async () => {
    const onExpandedChange = vi.fn()
    const onSelectedChange = vi.fn()
    const view = render(TreeView, {
      nodes, expandedIds: [], onExpandedChange, selectedIds: [], onSelectedChange,
      'aria-label': 'Library', 'data-testid': 'library-tree',
    })
    await tick()
    expect(screen.getByRole('tree', { name: 'Library' })).toHaveAttribute('data-testid', 'library-tree')
    const album = screen.getByRole('treeitem', { name: 'Album' })
    expect(album).toHaveAttribute('aria-expanded', 'false')
    expect(album).toHaveAttribute('aria-selected', 'false')
    expect(album).toHaveTextContent('2 files')
    await fireEvent.click(screen.getByRole('button', { name: 'Expand Album' }))
    expect(onExpandedChange).toHaveBeenCalledWith(['album'])
    expect(screen.queryByRole('treeitem', { name: 'Track A' })).toBeNull()
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Album' }))
    expect(onSelectedChange).toHaveBeenCalledWith(['album'])
    expect(screen.getByRole('checkbox', { name: 'Album' })).not.toBeChecked()
    await view.rerender({
      nodes, expandedIds: ['album'], onExpandedChange, selectedIds: ['album'], onSelectedChange,
      'aria-label': 'Library', 'data-testid': 'library-tree',
    })
    expect(screen.getByRole('treeitem', { name: 'Track A' })).toHaveAttribute('aria-level', '2')
    expect(screen.getByRole('treeitem', { name: 'Album' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('checkbox', { name: 'Album' })).toBeChecked()
  })

  it('navigates visible nodes with arrows, Home, End, and typeahead', async () => {
    const onExpandedChange = vi.fn()
    render(TreeView, { nodes, expandedIds: new Set(['album']), onExpandedChange })
    await tick()
    const album = screen.getByRole('treeitem', { name: 'Album' })
    const trackA = screen.getByRole('treeitem', { name: 'Track A' })
    const trackB = screen.getByRole('treeitem', { name: 'Track B' })
    const other = screen.getByRole('treeitem', { name: 'Other' })
    album.focus()
    await fireEvent.keyDown(album, { key: 'ArrowDown' })
    await tick()
    expect(trackA).toHaveFocus()
    await fireEvent.keyDown(trackA, { key: 'End' })
    await tick()
    expect(other).toHaveFocus()
    await fireEvent.keyDown(other, { key: 'Home' })
    await tick()
    expect(album).toHaveFocus()
    await fireEvent.keyDown(album, { key: 't' })
    await tick()
    expect(trackA).toHaveFocus()
    await fireEvent.keyDown(trackA, { key: 'ArrowDown' })
    await tick()
    expect(trackB).toHaveFocus()
    await fireEvent.keyDown(trackB, { key: 'ArrowLeft' })
    await tick()
    expect(album).toHaveFocus()
    await fireEvent.keyDown(album, { key: 'ArrowRight' })
    await tick()
    expect(trackA).toHaveFocus()
    await fireEvent.keyDown(trackA, { key: 'ArrowLeft' })
    await tick()
    expect(album).toHaveFocus()
    await fireEvent.keyDown(album, { key: 'ArrowLeft' })
    expect(onExpandedChange).toHaveBeenCalledWith([])
    expect(trackA).toBeInTheDocument()
  })

  it('requests expansion and selection from the focused treeitem', async () => {
    const onExpandedChange = vi.fn()
    const onSelectedChange = vi.fn()
    render(TreeView, { nodes, expandedIds: [], onExpandedChange, selectedIds: [], onSelectedChange })
    await tick()
    const album = screen.getByRole('treeitem', { name: 'Album' })
    album.focus()
    await fireEvent.keyDown(album, { key: 'ArrowRight' })
    expect(onExpandedChange).toHaveBeenCalledWith(['album'])
    await fireEvent.keyDown(album, { key: ' ' })
    expect(onSelectedChange).toHaveBeenCalledWith(['album'])
    expect(album).toHaveAttribute('aria-expanded', 'false')
    expect(album).toHaveAttribute('aria-selected', 'false')
  })

  it('returns focus to the visible ancestor when a controlled collapse removes the focused child', async () => {
    const onExpandedChange = vi.fn()
    const view = render(TreeView, { nodes, expandedIds: ['album'], onExpandedChange })
    await tick()
    screen.getByRole('treeitem', { name: 'Track A' }).focus()
    await view.rerender({ nodes, expandedIds: [], onExpandedChange })
    await tick()
    expect(screen.getByRole('treeitem', { name: 'Album' })).toHaveFocus()
  })
})
