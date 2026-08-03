import { describe, expect, it } from 'vitest'
import {
  compareValues,
  deriveFilteredSortedRows,
  deriveRows,
  getCellValue,
  matchesFilter,
  nextSort,
  visibleColumns,
} from './derive'
import type { TableColumn } from './types'

/*
 * These pin the semantics ported from the Alpine `core/table.js`. They are the
 * contract: if a backend sorts or filters the same rows, it has to agree with
 * this. Behavioral drift here is a bug even when the UI still looks right.
 */

type Track = { id: string; title: string; bpm: number | null; key: string }

const columns: TableColumn<Track>[] = [
  { id: 'title' },
  { id: 'bpm', type: 'number' },
  { id: 'key' },
]

const rows: Track[] = [
  { id: '1', title: 'track 10', bpm: 150, key: '2A' },
  { id: '2', title: 'track 2', bpm: 128, key: '9B' },
  { id: '3', title: 'track 1', bpm: null, key: '2A' },
  { id: '4', title: 'Track 3', bpm: 140, key: '4A' },
]

describe('compareValues', () => {
  it('orders null after every real value', () => {
    expect(compareValues(null, 5)).toBeGreaterThan(0)
    expect(compareValues(5, null)).toBeLessThan(0)
    expect(compareValues(null, null)).toBe(0)
    expect(compareValues(undefined, 'a')).toBeGreaterThan(0)
  })

  it('compares numbers numerically, not lexically', () => {
    expect(compareValues(9, 10)).toBeLessThan(0)
    expect(compareValues(100, 20)).toBeGreaterThan(0)
  })

  it('uses natural collation for strings', () => {
    // Lexical ordering would put "track 10" before "track 2".
    expect(compareValues('track 2', 'track 10')).toBeLessThan(0)
  })

  it('is case-insensitive', () => {
    expect(compareValues('alpha', 'ALPHA')).toBe(0)
  })
})

describe('matchesFilter', () => {
  it('passes everything for an empty filter', () => {
    expect(matchesFilter('anything', null)).toBe(true)
    expect(matchesFilter('anything', undefined)).toBe(true)
    expect(matchesFilter('anything', '')).toBe(true)
  })

  it('applies a function predicate', () => {
    const camelot = (value: unknown) => String(value).startsWith('2')
    expect(matchesFilter('2A', camelot)).toBe(true)
    expect(matchesFilter('9B', camelot)).toBe(false)
  })

  it('applies a numeric range', () => {
    expect(matchesFilter(140, { min: 128, max: 150 })).toBe(true)
    expect(matchesFilter(120, { min: 128 })).toBe(false)
    expect(matchesFilter(160, { max: 150 })).toBe(false)
    expect(matchesFilter('140', { min: 128 })).toBe(true)
  })

  it('excludes every spelling of absent from a range', () => {
    // The original used bare `Number(value)`: `null` and `''` became 0 and so
    // passed `{ min: 0 }`, while `undefined` became NaN and failed. Absent data
    // now behaves the same way whichever shape it arrives in.
    for (const absent of [null, undefined, '']) {
      expect(matchesFilter(absent, { min: 0 })).toBe(false)
      expect(matchesFilter(absent, { min: 0, max: 999 })).toBe(false)
    }
    expect(matchesFilter('not a number', { min: 0 })).toBe(false)
  })

  it('treats an open range as unbounded on the missing side', () => {
    expect(matchesFilter(9999, { min: 128 })).toBe(true)
    expect(matchesFilter(-1, { max: 150 })).toBe(true)
  })

  it('falls back to case-insensitive substring', () => {
    expect(matchesFilter('Track 3', 'track')).toBe(true)
    expect(matchesFilter('Track 3', 'TRACK')).toBe(true)
    expect(matchesFilter('Track 3', 'nope')).toBe(false)
    expect(matchesFilter(null, 'x')).toBe(false)
  })
})

describe('getCellValue', () => {
  it('reads by column id', () => {
    expect(getCellValue(rows[0], { id: 'bpm' })).toBe(150)
  })

  it('prefers an accessor', () => {
    expect(getCellValue(rows[0], { id: 'bpm', accessor: (r) => r.title })).toBe('track 10')
  })

  it('returns undefined for an unknown key or missing row', () => {
    expect(getCellValue(rows[0], { id: 'nope' })).toBeUndefined()
    expect(getCellValue(undefined, { id: 'bpm' })).toBeUndefined()
  })
})

describe('deriveRows', () => {
  it('sorts ascending with nulls last', () => {
    const out = deriveRows(rows, { columns, sort: { column: 'bpm', direction: 'asc' } })
    expect(out.map((r) => r.bpm)).toEqual([128, 140, 150, null])
  })

  it('moves nulls to the front when the direction flips', () => {
    // Deliberate: this is PostgreSQL's default (NULLS LAST asc, NULLS FIRST desc),
    // so a server-side ORDER BY and this client produce the same page of rows.
    const out = deriveRows(rows, { columns, sort: { column: 'bpm', direction: 'desc' } })
    expect(out.map((r) => r.bpm)).toEqual([null, 150, 140, 128])
  })

  it('does not mutate the input array', () => {
    const original = [...rows]
    deriveRows(rows, { columns, sort: { column: 'bpm', direction: 'desc' } })
    expect(rows).toEqual(original)
  })

  it('combines filters with AND', () => {
    const out = deriveRows(rows, {
      columns,
      filters: { key: '2A', title: 'track 1' },
    })
    expect(out.map((r) => r.id)).toEqual(['1', '3'])
  })

  it('ignores filters that would exclude nothing', () => {
    const out = deriveRows(rows, {
      columns,
      filters: { title: '', key: null, bpm: {} },
    })
    expect(out).toHaveLength(rows.length)
  })

  it('paginates last, so pages are taken from filtered and sorted rows', () => {
    // Paginating before filtering would page over rows about to disappear.
    const out = deriveRows(rows, {
      columns,
      filters: { key: '2A' },
      sort: { column: 'title', direction: 'asc' },
      page: { index: 0, size: 1 },
    })
    expect(out.map((r) => r.id)).toEqual(['3'])

    const second = deriveRows(rows, {
      columns,
      filters: { key: '2A' },
      sort: { column: 'title', direction: 'asc' },
      page: { index: 1, size: 1 },
    })
    expect(second.map((r) => r.id)).toEqual(['1'])
  })

  it('orders a custom stage by rank, not array position', () => {
    const seen: string[] = []
    const spy = {
      name: 'custom',
      apply: (r: readonly Track[]) => {
        seen.push(`custom:${r.length}`)
        return r
      },
    }
    // Rank 25 puts it after filter (10) and before sort (20)... no: after sort.
    deriveRows(rows, {
      columns,
      filters: { key: '2A' },
      stages: [spy],
    })
    // Filter ran first, so the custom stage sees 2 rows, not 4.
    expect(seen).toEqual(['custom:2'])
  })

  it('returns every row when no options are supplied', () => {
    expect(deriveRows(rows, { columns })).toHaveLength(4)
  })

  it('clamps a page size below one and a negative index', () => {
    expect(deriveRows(rows, { columns, page: { index: -3, size: 0 } })).toHaveLength(1)
  })
})

describe('deriveFilteredSortedRows', () => {
  it('is the same pipeline without pagination', () => {
    const input = {
      columns,
      filters: { key: '2A' },
      page: { index: 0, size: 1 },
    }
    expect(deriveRows(rows, input)).toHaveLength(1)
    // The denominator for "1–1 of 2".
    expect(deriveFilteredSortedRows(rows, input)).toHaveLength(2)
  })
})

describe('nextSort', () => {
  it('cycles unsorted -> asc -> desc -> unsorted', () => {
    const asc = nextSort(null, 'bpm')
    expect(asc).toEqual({ column: 'bpm', direction: 'asc' })

    const desc = nextSort(asc, 'bpm')
    expect(desc).toEqual({ column: 'bpm', direction: 'desc' })

    // Returning to unsorted is what gets the source order back.
    expect(nextSort(desc, 'bpm')).toBeNull()
  })

  it('restarts ascending when a different column is chosen', () => {
    expect(nextSort({ column: 'bpm', direction: 'desc' }, 'title')).toEqual({
      column: 'title',
      direction: 'asc',
    })
  })
})

describe('visibleColumns', () => {
  it('preserves order and drops hidden ids', () => {
    expect(visibleColumns(columns, ['bpm']).map((c) => c.id)).toEqual(['title', 'key'])
    expect(visibleColumns(columns).map((c) => c.id)).toEqual(['title', 'bpm', 'key'])
  })
})
