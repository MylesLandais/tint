/*
 * Column type registry, ported from `core/fieldtypes.js`.
 *
 * A column's `type` selects how its value is formatted and how the cell is
 * aligned. It covers the common cases so a column definition stays declarative;
 * `renderCell` is the escape hatch for anything else — the same split as
 * `renderPart` over the built-in chat part types.
 */

import type { ReactNode } from 'react'

export type TableFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'rating'
  | 'date'
  | 'linked-record'
  | 'computed'

export type TableFieldDefinition = {
  id: TableFieldType
  /** Right-align numerics so digits line up; everything else reads left. */
  align: 'start' | 'end'
  /** Tabular figures for values meant to be compared down a column. */
  mono: boolean
  /**
   * Declared but not implemented. A reserved type renders the em dash rather
   * than pretending to resolve a relation or run a formula.
   */
  reserved?: boolean
  format: (value: unknown) => ReactNode
}

/** What an absent value looks like. Consistent across every type. */
const EMPTY = '—'

function asText(value: unknown): ReactNode {
  if (value == null || value === '') return EMPTY
  return String(value)
}

export const TABLE_FIELD_TYPES: Record<TableFieldType, TableFieldDefinition> = {
  text: { id: 'text', align: 'start', mono: false, format: asText },
  number: { id: 'number', align: 'end', mono: true, format: asText },
  select: { id: 'select', align: 'start', mono: false, format: asText },
  date: { id: 'date', align: 'start', mono: true, format: asText },
  rating: {
    id: 'rating',
    align: 'start',
    mono: false,
    format(value) {
      const filled = Math.max(0, Math.min(5, Number(value) || 0))
      return '●'.repeat(filled) + '○'.repeat(5 - filled)
    },
  },
  'linked-record': {
    id: 'linked-record',
    align: 'start',
    mono: false,
    reserved: true,
    format: () => EMPTY,
  },
  computed: {
    id: 'computed',
    align: 'start',
    mono: true,
    reserved: true,
    format: () => EMPTY,
  },
}

/** Unknown type ids fall back to `text` rather than throwing. */
export function resolveFieldType(type?: TableFieldType): TableFieldDefinition {
  return TABLE_FIELD_TYPES[type ?? 'text'] ?? TABLE_FIELD_TYPES.text
}

export function formatFieldValue(value: unknown, type?: TableFieldType): ReactNode {
  return resolveFieldType(type).format(value)
}

export function isReservedFieldType(type?: TableFieldType): boolean {
  return Boolean(resolveFieldType(type).reserved)
}

export function listFieldTypes(): TableFieldType[] {
  return Object.keys(TABLE_FIELD_TYPES) as TableFieldType[]
}
