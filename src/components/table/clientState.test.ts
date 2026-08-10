import { describe, expect, it } from 'vitest'
import {
  evaluateFilterItem,
  toColumnFilters,
  toDataSortingState,
  toDeriveFilters,
  toTableSort,
} from './clientState'
import { deriveFilteredSortedRows } from './derive'
import type { DataFilterModel } from './filterTypes'
import type { TableColumn } from './types'

type Row = { id: string; name: string; tracks: number; state: string }

const columns: TableColumn<Row>[] = [
  { id: 'name' },
  { id: 'tracks', type: 'number' },
  { id: 'state' },
]

const rows: Row[] = [
  { id: '1', name: 'Alpha', tracks: 10, state: 'library' },
  { id: '2', name: 'Beta', tracks: 3, state: 'wishlist' },
  { id: '3', name: 'Alpine', tracks: 20, state: 'library' },
]

describe('toTableSort / toDataSortingState', () => {
  it('round-trips the primary column', () => {
    const sorting = [{ id: 'tracks', desc: true }] as const
    expect(toTableSort(sorting)).toEqual({ column: 'tracks', direction: 'desc' })
    expect(toDataSortingState({ column: 'tracks', direction: 'desc' })).toEqual([
      { id: 'tracks', desc: true },
    ])
  })

  it('maps empty sorting to unsorted', () => {
    expect(toTableSort([])).toBeNull()
    expect(toDataSortingState(null)).toEqual([])
  })
})

describe('evaluateFilterItem', () => {
  it('applies contains case-insensitively', () => {
    expect(evaluateFilterItem('Alpine', { operator: 'contains', value: 'alp' })).toBe(true)
    expect(evaluateFilterItem('Beta', { operator: 'contains', value: 'alp' })).toBe(false)
  })

  it('applies equals for strings and numbers', () => {
    expect(evaluateFilterItem('library', { operator: 'equals', value: 'Library' })).toBe(true)
    expect(evaluateFilterItem(10, { operator: 'equals', value: 10 })).toBe(true)
    expect(evaluateFilterItem(10, { operator: 'notEquals', value: 3 })).toBe(true)
  })

  it('applies relational operators and fails closed on absent', () => {
    expect(evaluateFilterItem(20, { operator: 'gte', value: 10 })).toBe(true)
    expect(evaluateFilterItem(3, { operator: 'gt', value: 10 })).toBe(false)
    expect(evaluateFilterItem(null, { operator: 'lt', value: 10 })).toBe(false)
  })
})

describe('toDeriveFilters', () => {
  it('AND-s items across fields and shrinks derived rows', () => {
    const model: DataFilterModel = {
      items: [
        { id: 'a', field: 'name', operator: 'contains', value: 'alp' },
        { id: 'b', field: 'state', operator: 'equals', value: 'library' },
      ],
    }
    const filters = toDeriveFilters(model)
    const result = deriveFilteredSortedRows(rows, { columns, filters })
    expect(result.map((row) => row.id)).toEqual(['1', '3'])
  })

  it('AND-s multiple items on the same field', () => {
    const model: DataFilterModel = {
      items: [
        { id: 'a', field: 'tracks', operator: 'gte', value: 5 },
        { id: 'b', field: 'tracks', operator: 'lte', value: 15 },
      ],
    }
    const filters = toDeriveFilters(model)
    const result = deriveFilteredSortedRows(rows, { columns, filters })
    expect(result.map((row) => row.id)).toEqual(['1'])
  })
})

describe('toColumnFilters', () => {
  it('emits one TanStack entry per field with predicate values', () => {
    const model: DataFilterModel = {
      items: [{ id: 'a', field: 'name', operator: 'contains', value: 'a' }],
    }
    const columnFilters = toColumnFilters(model)
    expect(columnFilters).toHaveLength(1)
    expect(columnFilters[0]?.id).toBe('name')
    expect(typeof columnFilters[0]?.value).toBe('function')
    // Non-null rather than `?.`: the length assertion above already guarantees
    // the entry, and optional chaining here would call `undefined`.
    expect((columnFilters[0]!.value as (v: unknown) => boolean)('Alpha')).toBe(true)
  })
})
