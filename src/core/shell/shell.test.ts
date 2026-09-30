import { describe, expect, it } from 'vitest'
import { filterCommands, flattenNavGroups, nextCommandIndex, nextWorkspaceTabId } from './navigation'
import { keyboardSplitSize, mobileNavigationForWidth, pointerSplitSize, workspaceBodyColumns } from './layout'

describe('shell navigation model', () => {
  it('keeps group order and marks only the first item of following groups as a divider', () => {
    const flat = flattenNavGroups([
      { id: 'a', items: [{ id: 'one', label: 'One', href: '/one' }] },
      { id: 'b', items: [{ id: 'two', label: 'Two', href: '/two' }, { id: 'three', label: 'Three', href: '/three' }] },
    ])
    expect(flat.map(({ item, divider }) => [item.id, divider])).toEqual([['one', false], ['two', true], ['three', false]])
  })

  it('filters by label, description, keywords, and group while skipping disabled commands with arrows', () => {
    const items = [
      { id: 'open', label: 'Open project', group: 'File' },
      { id: 'hidden', label: 'Hidden', disabled: true },
      { id: 'settings', label: 'Settings', description: 'Workspace preferences', keywords: ['config'] },
    ]
    expect(filterCommands(items, 'workspace config').map((item) => item.id)).toEqual(['settings'])
    expect(nextCommandIndex(items, 0, 'ArrowDown')).toBe(2)
    expect(nextCommandIndex(items, 0, 'ArrowUp')).toBe(2)
    expect(nextCommandIndex(items, 2, 'Home')).toBe(0)
  })

  it('moves tabs over disabled peers and wraps from the end', () => {
    const tabs = [{ id: 'one', label: 'One' }, { id: 'off', label: 'Off', disabled: true }, { id: 'two', label: 'Two' }]
    expect(nextWorkspaceTabId(tabs, 'one', 'ArrowRight')).toBe('two')
    expect(nextWorkspaceTabId(tabs, 'two', 'ArrowRight')).toBe('one')
  })
})

describe('shell layout model', () => {
  it('uses the workspace container for columns unless the host explicitly requests a split', () => {
    expect(workspaceBodyColumns({ navigation: true, inspector: true, split: 'container' })).toContain('@4xl/workspace:')
    expect(workspaceBodyColumns({ navigation: true, inspector: true, split: 'always' })).not.toContain('@4xl/workspace:')
    expect(workspaceBodyColumns({ navigation: false, inspector: false, split: 'always' })).toBeUndefined()
  })

  it('clamps pointer and keyboard resizing with the correct second-pane sign', () => {
    expect(pointerSplitSize(200, -20, 'second', 100, 300)).toBe(220)
    expect(keyboardSplitSize(200, 'ArrowLeft', false, 'horizontal', 'second', 100, 300)).toBe(210)
    expect(keyboardSplitSize(200, 'ArrowRight', true, 'horizontal', 'first', 100, 300)).toBe(250)
    expect(keyboardSplitSize(200, 'Home', false, 'horizontal', 'first', 100, 300)).toBe(100)
    expect(keyboardSplitSize(200, 'ArrowDown', false, 'horizontal', 'first', 100, 300)).toBeNull()
  })

  it('uses available container width for the mobile navigation decision', () => {
    expect(mobileNavigationForWidth(720)).toBe(true)
    expect(mobileNavigationForWidth(768)).toBe(false)
  })
})
