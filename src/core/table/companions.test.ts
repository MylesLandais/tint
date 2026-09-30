import { describe, expect, it } from 'vitest'
import { buildFilterItem, operatorsFor } from './filterControls'
import { columnsFor, placeMasonryItems } from './masonry'
import { filterMediaReleases } from './mediaWorkspace'
import { deriveWorkbenchRows } from './workbench'
import { compactWorkspaceItems, workspaceBreakpointFor, workspaceLayoutsEqual } from './workspaceGrid'

describe('table companions', () => {
  it('builds typed filters and respects a field-specific operator list', () => {
    const field = { id: 'genre', label: 'Genre', type: 'select' as const, options: [{ value: 'dnb', label: 'Drum & Bass' }], operators: ['equals' as const] }
    expect(operatorsFor(field)).toEqual(['equals'])
    expect(buildFilterItem('f1', field, 'equals', 'dnb')).toEqual({
      id: 'f1', field: 'genre', operator: 'equals', value: 'dnb', displayValue: 'Drum & Bass',
    })
    expect(buildFilterItem('f2', { id: 'bpm', label: 'BPM', type: 'number' }, 'gte', '120').value).toBe(120)
  })

  it('packs masonry by shortest column and derives count from container width', () => {
    expect(columnsFor(600)).toBe(1)
    expect(columnsFor(700)).toBe(2)
    expect(columnsFor(1200, 'auto', 300)).toBe(4)
    expect(placeMasonryItems(600, [100, 40, 90], 2, 10)).toEqual({
      positions: [
        { x: 0, y: 0, width: 295 },
        { x: 305, y: 0, width: 295 },
        { x: 305, y: 50, width: 295 },
      ],
      height: 140,
    })
  })

  it('filters media releases without mutating data', () => {
    const releases = [
      { id: 'a', title: 'Track One', indexer: 'Alpha', size: '1 GB', peers: '2', age: '1h', score: 9 },
      { id: 'b', title: 'Track Two', indexer: 'Beta', size: '2 GB', peers: '3', age: '2h', score: 8 },
    ]
    expect(filterMediaReleases(releases, 'BETA').map((row) => row.id)).toEqual(['b'])
    expect(releases).toHaveLength(2)
  })

  it('chooses workspace breakpoints from container width', () => {
    const breakpoints = { lg: 1200, md: 768, sm: 0 }
    expect(workspaceBreakpointFor(1199, breakpoints)).toBe('md')
    expect(workspaceBreakpointFor(767, breakpoints)).toBe('sm')
    expect(workspaceLayoutsEqual({ lg: [{ id: 'a', x: 0, y: 0, w: 1, h: 1 }] }, { lg: [{ id: 'a', x: 0, y: 0, w: 1, h: 1 }] })).toBe(true)
  })

  it('keeps an edited workspace item fixed and compacts peers without overlap', () => {
    const packed = compactWorkspaceItems([
      { id: 'a', x: 0, y: 0, w: 2, h: 2 },
      { id: 'b', x: 0, y: 0, w: 2, h: 1 },
      { id: 'c', x: 3, y: 4, w: 1, h: 1 },
    ], 'a')
    expect(packed).toEqual([
      { id: 'a', x: 0, y: 0, w: 2, h: 2 },
      { id: 'b', x: 0, y: 2, w: 2, h: 1 },
      { id: 'c', x: 3, y: 0, w: 1, h: 1 },
    ])
  })

  it('filters, sorts, and pages the workbench in plain TypeScript', () => {
    const rows = [
      { id: 'a', genre: 'ambient', bpm: 90 },
      { id: 'b', genre: 'house', bpm: 128 },
      { id: 'c', genre: 'house', bpm: 122 },
    ]
    const result = deriveWorkbenchRows(rows, [{ id: 'genre' }, { id: 'bpm' }], {
      filterModel: { items: [{ id: 'f', field: 'genre', operator: 'equals', value: 'house' }] },
      sorting: [{ id: 'bpm', desc: true }], page: 1, pageSize: 1,
    })
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.rows.map((row) => row.id)).toEqual(['c'])
  })
})
