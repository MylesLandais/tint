import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDataTable } from './useDataTable'
import type { TableColumn } from './types'

/*
 * The engine is vendored, so what needs proving is not that TanStack works but
 * that it works *with tint's semantics registered* — the null placement and
 * filter resolution that `derive.test.ts` pins.
 */

type Track = { id: string; title: string; bpm: number | null }

const columns: TableColumn<Track>[] = [
  { id: 'title', sortable: true },
  { id: 'bpm', sortable: true, type: 'number' },
]

const data: Track[] = [
  { id: '1', title: 'track 10', bpm: 150 },
  { id: '2', title: 'track 2', bpm: 128 },
  { id: '3', title: 'track 1', bpm: null },
  { id: '4', title: 'Track 3', bpm: 140 },
]

function setup() {
  return renderHook(() => useDataTable({ data, columns, rowId: 'id' }))
}

describe('useDataTable', () => {
  it('exposes every row through the core model by default', () => {
    const { result } = setup()
    expect(result.current.getRowModel().rows).toHaveLength(4)
  })

  it('keys rows by the supplied id', () => {
    const { result } = setup()
    expect(result.current.getRowModel().rows.map((r) => r.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])
  })

  it('sorts with tint natural ordering, not lexical', () => {
    const { result } = setup()
    act(() => result.current.setSorting([{ id: 'title', desc: false }]))

    // Lexical ordering would put "track 10" before "track 2".
    expect(result.current.getRowModel().rows.map((r) => r.original.title)).toEqual([
      'track 1',
      'track 2',
      'Track 3',
      'track 10',
    ])
  })

  it('places nulls last ascending and first descending, as SQL does', () => {
    const { result } = setup()

    act(() => result.current.setSorting([{ id: 'bpm', desc: false }]))
    expect(result.current.getRowModel().rows.map((r) => r.original.bpm)).toEqual([
      128, 140, 150, null,
    ])

    act(() => result.current.setSorting([{ id: 'bpm', desc: true }]))
    expect(result.current.getRowModel().rows.map((r) => r.original.bpm)).toEqual([
      null, 150, 140, 128,
    ])
  })

  it('filters with tint predicate resolution', () => {
    const { result } = setup()

    // Substring, case-insensitive. Unsorted, so these stay in source order.
    act(() => result.current.getColumn('title')!.setFilterValue('TRACK 1'))
    expect(result.current.getRowModel().rows.map((r) => r.original.title)).toEqual([
      'track 10',
      'track 1',
    ])

    // Numeric range, with absent values excluded.
    act(() => result.current.getColumn('title')!.setFilterValue(undefined))
    act(() => result.current.getColumn('bpm')!.setFilterValue({ min: 130 }))
    expect(result.current.getRowModel().rows.map((r) => r.original.bpm)).toEqual([
      150, 140,
    ])
  })

  it('accepts a function predicate, so callers can supply domain logic', () => {
    const { result } = setup()
    act(() =>
      result.current
        .getColumn('bpm')!
        .setFilterValue(() => (value: unknown) => Number(value) === 140),
    )
    expect(result.current.getRowModel().rows.map((r) => r.original.bpm)).toEqual([140])
  })

  it('paginates after filtering, never before', () => {
    const { result } = setup()
    act(() => result.current.setPageSize(2))
    expect(result.current.getRowModel().rows).toHaveLength(2)
    expect(result.current.getPageCount()).toBe(2)

    act(() => result.current.nextPage())
    expect(result.current.getRowModel().rows.map((r) => r.id)).toEqual(['3', '4'])
  })

  it('tracks row selection', () => {
    const { result } = setup()
    act(() => result.current.getRowModel().rows[0]!.toggleSelected(true))
    expect(result.current.getSelectedRowModel().rows.map((r) => r.id)).toEqual(['1'])
  })

  it('honours a composite row id function', () => {
    const { result } = renderHook(() =>
      useDataTable({ data, columns, rowId: (row) => `t-${row.id}` }),
    )
    expect(result.current.getRowModel().rows[0]!.id).toBe('t-1')
  })
})
