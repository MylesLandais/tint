import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Menu, Popover, Tabs } from './index'

describe('Base UI wrappers', () => {
  it('closes a controlled menu on Escape and supports item selection', () => {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()
    render(<Menu open onOpenChange={onOpenChange} trigger={<button type="button">Actions</button>} items={[{ id: 'archive', label: 'Archive', onSelect }]} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders a controlled popover and dismisses it with Escape', () => {
    const onOpenChange = vi.fn()
    render(<Popover open onOpenChange={onOpenChange} trigger={<button type="button">Details</button>} title="Details">Body</Popover>)
    expect(screen.getByText('Body')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('reports tab selection without owning it', () => {
    const onValueChange = vi.fn()
    render(<Tabs value="one" onValueChange={onValueChange} tabs={[{ id: 'one', label: 'One', content: 'First' }, { id: 'two', label: 'Two', content: 'Second' }]} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(onValueChange).toHaveBeenCalledWith('two')
  })
})
