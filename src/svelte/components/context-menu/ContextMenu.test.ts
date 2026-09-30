import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { tick } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import ContextMenu from './ContextMenu.svelte'

const items = [
  { id: 'archive', label: 'Archive' },
  { id: 'separator', type: 'separator' as const },
  { id: 'unavailable', label: 'Unavailable', disabled: true },
  { id: 'delete', label: 'Delete', danger: true },
]

describe('ContextMenu', () => {
  it('renders only with a pointer position and preserves controlled state after selection', async () => {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(ContextMenu, { open: true, position: { x: 120, y: 150 }, onOpenChange, items: [
      { id: 'archive', label: 'Archive', onSelect },
    ], id: 'pointer-menu', 'data-testid': 'pointer-menu' })
    await tick()
    const menu = screen.getByRole('menu', { name: 'Context menu' })
    expect(menu).toHaveAttribute('id', 'pointer-menu')
    expect(menu).toHaveAttribute('data-testid', 'pointer-menu')
    await waitFor(() => expect(menu.style.left).toBe('120px'))
    expect(menu.style.top).toBe('150px')
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(menu).toBeInTheDocument()
  })

  it('does not render without a pointer position', () => {
    render(ContextMenu, { open: true, position: null, onOpenChange: vi.fn(), items })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('returns focus to the previous control after selecting an action', async () => {
    const previous = document.createElement('button')
    previous.textContent = 'Open context actions'
    document.body.append(previous)
    previous.focus()
    try {
      const onOpenChange = vi.fn()
      render(ContextMenu, {
        open: true, position: { x: 40, y: 50 }, onOpenChange,
        items: [{ id: 'archive', label: 'Archive', onSelect: vi.fn() }],
      })
      await tick()
      await fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(previous).toHaveFocus()
    } finally {
      previous.remove()
    }
  })

  it('skips disabled items, supports typeahead, and returns focus on Escape', async () => {
    const previous = document.createElement('button')
    previous.textContent = 'Previous focus'
    document.body.append(previous)
    previous.focus()
    try {
      const onOpenChange = vi.fn()
      render(ContextMenu, { open: true, position: { x: 40, y: 50 }, onOpenChange, items })
      await tick()
      const archive = screen.getByRole('menuitem', { name: 'Archive' })
      const deleteItem = screen.getByRole('menuitem', { name: 'Delete' })
      expect(archive).toHaveFocus()
      await fireEvent.keyDown(archive, { key: 'ArrowDown' })
      expect(deleteItem).toHaveFocus()
      await fireEvent.keyDown(deleteItem, { key: 'Home' })
      expect(archive).toHaveFocus()
      await fireEvent.keyDown(archive, { key: 'd' })
      expect(deleteItem).toHaveFocus()
      await fireEvent.keyDown(document, { key: 'Escape' })
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(previous).toHaveFocus()
      expect(screen.getByRole('menu')).toBeInTheDocument()
    } finally {
      previous.remove()
    }
  })

  it('requests close when the pointer lands outside', async () => {
    const onOpenChange = vi.fn()
    render(ContextMenu, { open: true, position: { x: 40, y: 50 }, onOpenChange, items })
    await tick()
    await fireEvent.pointerDown(document.body)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
