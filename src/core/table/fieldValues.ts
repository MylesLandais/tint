/*
 * Per-type editing behavior: parse a draft string into a typed value, validate
 * it, compare two values for sorting, and say what a fresh cell holds. Kept
 * apart from the `fieldTypes` display registry so renderers that only format
 * values do not pull in editing logic.
 */
import type { TableFieldType } from './fieldTypes'

export type CellIssue = { state: 'invalid' | 'warn'; message: string }
export type ParsedCell = { ok: true; value: unknown; warning?: string } | { ok: false; message: string }

export type FieldValueBehavior = {
  /** Value a new row holds for this type. */
  empty: unknown
  parse: (draft: string) => ParsedCell
  /** Total order used for sorting; empties sort last. */
  compare: (a: unknown, b: unknown) => number
  /** Types whose editor is a toggle/picker and so commits without a text draft. */
  directEdit?: boolean
}

const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)

function withEmptiesLast(cmp: (a: never, b: never) => number) {
  return (a: unknown, b: unknown) => {
    if (isEmpty(a) && isEmpty(b)) return 0
    if (isEmpty(a)) return 1
    if (isEmpty(b)) return -1
    return (cmp as (a: unknown, b: unknown) => number)(a, b)
  }
}

const textCompare = withEmptiesLast((a: unknown, b: unknown) =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }),
)
const numberCompare = withEmptiesLast((a: unknown, b: unknown) => Number(a) - Number(b))

const text = (draft: string): ParsedCell => ({ ok: true, value: draft })

const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i
const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/

export const FIELD_VALUE_BEHAVIOR: Record<TableFieldType, FieldValueBehavior> = {
  text: { empty: '', parse: text, compare: textCompare },
  'long-text': { empty: '', parse: text, compare: textCompare },
  select: { empty: null, parse: (d) => ({ ok: true, value: d.trim() === '' ? null : d.trim() }), compare: textCompare },
  'linked-record': {
    empty: null,
    parse: (d) => ({ ok: true, value: d.trim() === '' ? null : d.trim() }),
    compare: textCompare,
  },
  number: {
    empty: null,
    compare: numberCompare,
    parse(draft) {
      const t = draft.trim().replace(/,/g, '')
      if (t === '') return { ok: true, value: null }
      const n = Number(t)
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, message: 'Enter a number' }
    },
  },
  rating: {
    empty: null,
    compare: numberCompare,
    directEdit: true,
    parse(draft) {
      const t = draft.trim()
      if (t === '') return { ok: true, value: null }
      const n = Number(t)
      return Number.isInteger(n) && n >= 0 && n <= 5
        ? { ok: true, value: n === 0 ? null : n }
        : { ok: false, message: 'Rating is 1 to 5' }
    },
  },
  date: {
    empty: null,
    compare: textCompare,
    parse(draft) {
      const t = draft.trim()
      if (t === '') return { ok: true, value: null }
      if (!DATE_PATTERN.test(t)) return { ok: false, message: 'Use YYYY, YYYY-MM or YYYY-MM-DD' }
      if (t.length === 10 && Number.isNaN(Date.parse(t))) return { ok: false, message: 'Not a real date' }
      return { ok: true, value: t }
    },
  },
  url: {
    empty: '',
    compare: textCompare,
    parse(draft) {
      const t = draft.trim()
      if (t === '') return { ok: true, value: '' }
      if (URL_PATTERN.test(t)) return { ok: true, value: t }
      // Soft failure: keep the value but flag it, as spreadsheets do.
      return { ok: true, value: t, warning: 'Not a valid http(s) link' }
    },
  },
  checkbox: {
    empty: false,
    directEdit: true,
    compare: (a, b) => Number(Boolean(b)) - Number(Boolean(a)),
    parse(draft) {
      const t = draft.trim().toLowerCase()
      if (['true', 'yes', '1', 'x', '✓'].includes(t)) return { ok: true, value: true }
      if (['false', 'no', '0', ''].includes(t)) return { ok: true, value: false }
      return { ok: false, message: 'Use yes or no' }
    },
  },
  'multi-select': {
    empty: [],
    compare: withEmptiesLast((a: unknown[], b: unknown[]) => String(a[0]).localeCompare(String(b[0]))),
    parse(draft) {
      const values = draft.split(/[;,]/).map((v) => v.trim()).filter(Boolean)
      return { ok: true, value: [...new Set(values)] }
    },
  },
  computed: { empty: null, parse: text, compare: textCompare },
}

export function parseFieldValue(type: TableFieldType | undefined, draft: string): ParsedCell {
  return (FIELD_VALUE_BEHAVIOR[type ?? 'text'] ?? FIELD_VALUE_BEHAVIOR.text).parse(draft)
}

export function compareFieldValues(type: TableFieldType | undefined, a: unknown, b: unknown): number {
  return (FIELD_VALUE_BEHAVIOR[type ?? 'text'] ?? FIELD_VALUE_BEHAVIOR.text).compare(a, b)
}

export function emptyFieldValue(type: TableFieldType | undefined): unknown {
  const empty = (FIELD_VALUE_BEHAVIOR[type ?? 'text'] ?? FIELD_VALUE_BEHAVIOR.text).empty
  return Array.isArray(empty) ? [] : empty
}

/** Serialises a typed value back to the draft string a text editor or clipboard shows. */
export function draftFromValue(type: TableFieldType | undefined, value: unknown): string {
  if (value == null) return ''
  if (type === 'checkbox') return value ? 'yes' : 'no'
  if (Array.isArray(value)) return value.join('; ')
  return String(value)
}

/** Resolve a draft to the issue a cell should display, if any. */
export function cellIssue(type: TableFieldType | undefined, draft: string): CellIssue | null {
  const parsed = parseFieldValue(type, draft)
  if (!parsed.ok) return { state: 'invalid', message: parsed.message }
  if (parsed.warning) return { state: 'warn', message: parsed.warning }
  return null
}
