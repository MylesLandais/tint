import { describe, expect, it } from 'vitest'
import {
  IDLE, addField, addFieldOption, applyDatasetOps, cellClickAction, duplicateRow, ratingFromPointer, applyView, emptyRow, invertOp, canRedoEdit, canUndoEdit, cellSelection, createView, editReducer,
  emptyEditHistory, isCellInSelection, moveField, navigateCells, parseFieldValue, parseTsv, planFillDown,
  planPaste, planRetype, recordEdit, redoEdit, removeField, renameField, setPrimaryField, toTsv,
  undoEdit, visibleFields, type FieldDef,
} from './index'

const dims = { rows: 5, cols: 4 }

describe('cell navigation', () => {
  it('clamps arrows and jumps to edges with mod', () => {
    expect(navigateCells(cellSelection(0, 0), 'ArrowUp', dims).anchor).toEqual({ row: 0, col: 0 })
    expect(navigateCells(cellSelection(1, 1), 'ArrowDown', dims, { mod: true }).anchor).toEqual({ row: 4, col: 1 })
  })
  it('Tab wraps across rows and Shift+Tab reverses', () => {
    expect(navigateCells(cellSelection(0, 3), 'Tab', dims).anchor).toEqual({ row: 1, col: 0 })
    expect(navigateCells(cellSelection(1, 0), 'Tab', dims, { shift: true }).anchor).toEqual({ row: 0, col: 3 })
  })
  it('Shift+arrow extends a range from the anchor', () => {
    const sel = navigateCells(navigateCells(cellSelection(1, 1), 'ArrowDown', dims, { shift: true }), 'ArrowRight', dims, { shift: true })
    expect(sel.anchor).toEqual({ row: 1, col: 1 })
    expect(sel.focus).toEqual({ row: 2, col: 2 })
    expect(isCellInSelection(sel, { row: 2, col: 1 })).toBe(true)
    expect(isCellInSelection(sel, { row: 3, col: 1 })).toBe(false)
  })
})

describe('edit session', () => {
  const cell = { row: 0, col: 0 }
  it('typing over a cell seeds the draft; escape cancels', () => {
    let s = editReducer(IDLE, { type: 'begin', cell, fieldType: 'number', value: 5, seed: '7' })
    expect(s).toMatchObject({ phase: 'editing', original: '5', draft: '7' })
    s = editReducer(s, { type: 'cancel' })
    expect(s.phase).toBe('idle')
  })
  it('an invalid draft blocks commit and surfaces the issue', () => {
    let s = editReducer(IDLE, { type: 'begin', cell, fieldType: 'number', value: 5 })
    s = editReducer(s, { type: 'input', draft: 'abc' })
    s = editReducer(s, { type: 'commit' })
    expect(s).toMatchObject({ phase: 'error', issue: { state: 'invalid', message: 'Enter a number' } })
    s = editReducer(s, { type: 'input', draft: '12' })
    expect(editReducer(s, { type: 'commit' }).phase).toBe('committing')
  })
  it('a url warning does not block commit', () => {
    let s = editReducer(IDLE, { type: 'begin', cell, fieldType: 'url', value: '' , seed: 'example'})
    expect(s).toMatchObject({ issue: { state: 'warn' } })
    s = editReducer(s, { type: 'commit' })
    expect(s.phase).toBe('committing')
    expect(editReducer(s, { type: 'failed', message: 'offline' })).toMatchObject({ phase: 'error', issue: { message: 'offline' } })
  })
})

describe('field value parsing', () => {
  it('parses typed values', () => {
    expect(parseFieldValue('number', '1,200')).toEqual({ ok: true, value: 1200 })
    expect(parseFieldValue('checkbox', 'Yes')).toEqual({ ok: true, value: true })
    expect(parseFieldValue('multi-select', 'a; b, a')).toEqual({ ok: true, value: ['a', 'b'] })
    expect(parseFieldValue('rating', '9').ok).toBe(false)
    expect(parseFieldValue('date', '2024-13-45').ok).toBe(false)
    expect(parseFieldValue('date', '1999')).toEqual({ ok: true, value: '1999' })
  })
})

describe('clipboard', () => {
  it('round-trips quoted tabs and newlines', () => {
    const matrix = [['a', 'b\tc'], ['line1\nline2', 'say "hi"']]
    expect(parseTsv(toTsv(matrix))).toEqual(matrix)
  })
  it('a single value fills the selected range; a block clips to the grid', () => {
    const range = { anchor: { row: 0, col: 0 }, focus: { row: 1, col: 1 } }
    expect(planPaste(range, [['x']], dims)).toHaveLength(4)
    const block = [['1', '2', '3'], ['4', '5', '6']]
    expect(planPaste(cellSelection(4, 2), block, dims).map((w) => w.draft)).toEqual(['1', '2'])
  })
  it('fill down copies the top row through the range', () => {
    const fills = planFillDown({ anchor: { row: 1, col: 0 }, focus: { row: 3, col: 1 } })
    expect(fills).toHaveLength(4)
    expect(fills[0]).toEqual({ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } })
  })
})

describe('history', () => {
  it('undoes and redoes batches and drops no-ops', () => {
    let h = emptyEditHistory()
    h = recordEdit(h, { label: 'noop', ops: [{ kind: 'cell', rowId: '1', field: 'a', before: 1, after: 1 }] })
    expect(canUndoEdit(h)).toBe(false)
    h = recordEdit(h, { label: 'paste', ops: [
      { kind: 'cell', rowId: '1', field: 'a', before: 1, after: 2 },
      { kind: 'cell', rowId: '2', field: 'a', before: 3, after: 4 },
    ] })
    const u = undoEdit(h)!
    expect(u.ops).toEqual([
      { kind: 'cell', rowId: '2', field: 'a', before: 4, after: 3 },
      { kind: 'cell', rowId: '1', field: 'a', before: 2, after: 1 },
    ])
    expect(canRedoEdit(u.history)).toBe(true)
    expect(redoEdit(u.history)!.history.past).toHaveLength(1)
    expect(canRedoEdit(recordEdit(u.history, { label: 'x', ops: [{ kind: 'cell', rowId: '1', field: 'a', before: 1, after: 9 }] }))).toBe(false)
  })
})

describe('schema and views', () => {
  const fields: FieldDef[] = [
    { id: 'title', name: 'Title', type: 'text' },
    { id: 'pages', name: 'Pages', type: 'number' },
    { id: 'tags', name: 'Tags', type: 'multi-select' },
  ]
  it('keeps the primary field first and undeletable', () => {
    expect(removeField(fields, 'title')).toHaveLength(3)
    expect(moveField(fields, 'tags', 0)[1].id).toBe('tags')
    expect(setPrimaryField(fields, 'pages')[0].id).toBe('pages')
    expect(renameField(fields, 'pages', 'title')[1].name).toBe('Pages')
    expect(addField(fields, 'Pages').at(-1)!.name).toBe('Pages 2')
  })
  it('plans a retype and reports cleared values', () => {
    const rows = [{ id: 'a', pages: '12' }, { id: 'b', pages: 'many' }, { id: 'c', pages: null }]
    const report = planRetype(rows, (r) => r.id, { id: 'pages', name: 'Pages', type: 'text' }, 'number')
    expect(report).toMatchObject({ converted: 1, cleared: 1 })
    expect(report.values.get('a')).toBe(12)
  })
  const rows = [
    { id: '1', title: 'B', pages: 200, tags: ['x'] },
    { id: '2', title: 'A', pages: null, tags: [] },
    { id: '3', title: 'C', pages: 50, tags: ['x', 'y'] },
  ]
  it('filters, sorts with blanks last in both directions, and groups', () => {
    const view = createView('v', 'V', { sorts: [{ field: 'pages', desc: true }], filters: [{ id: 'f', field: 'title', operator: 'notEquals', value: 'zzz' }] })
    expect(applyView(rows, fields, view).rows.map((r) => r.id)).toEqual(['1', '3', '2'])
    expect(applyView(rows, fields, { ...view, sorts: [{ field: 'pages', desc: false }] }).rows.map((r) => r.id)).toEqual(['3', '1', '2'])
    const grouped = applyView(rows, fields, createView('g', 'G', { groupBy: 'tags' }))
    expect(grouped.groups?.map((g) => g.label)).toEqual(['x', 'Empty'])
    const gt = applyView(rows, fields, createView('r', 'R', { filters: [{ id: 'f', field: 'pages', operator: 'gt', value: 100 }] }))
    expect(gt.rows.map((r) => r.id)).toEqual(['1'])
  })
  it('hides and orders fields but never hides the primary', () => {
    const view = createView('v', 'V', { hidden: ['title', 'pages'], order: ['tags', 'pages'] })
    expect(visibleFields(fields, view).map((f) => f.id)).toEqual(['title', 'tags'])
  })
})

describe('applyDatasetOps', () => {
  const fields: FieldDef[] = [{ id: 'title', name: 'Title', type: 'text' }, { id: 'done', name: 'Done', type: 'checkbox' }]
  const rows = [{ id: 'a', title: 'A', done: false }, { id: 'b', title: 'B', done: false }]
  it('applies, inverts and shares untouched rows', () => {
    const op = { kind: 'cell', rowId: 'a', field: 'done', before: false, after: true } as const
    const next = applyDatasetOps({ rows, fields }, [op])
    expect(next.rows[0].done).toBe(true)
    expect(next.rows[1]).toBe(rows[1])
    expect(rows[0].done).toBe(false)
    const back = applyDatasetOps(next, [invertOp(op)])
    expect(back.rows[0].done).toBe(false)
  })
  it('inserts, removes and swaps schema', () => {
    const row = emptyRow(fields, 'c')
    expect(row).toEqual({ id: 'c', title: '', done: false })
    const inserted = applyDatasetOps({ rows, fields }, [{ kind: 'insert-row', row, index: 1 }])
    expect(inserted.rows.map((r) => r.id)).toEqual(['a', 'c', 'b'])
    expect(applyDatasetOps(inserted, [{ kind: 'remove-row', row, index: 1 }]).rows.map((r) => r.id)).toEqual(['a', 'b'])
    expect(applyDatasetOps({ rows, fields }, [{ kind: 'schema', before: fields, after: [fields[0]] }]).fields).toHaveLength(1)
  })
})

describe('click model', () => {
  const sel = (r: number, c: number) => cellSelection(r, c)
  it('first click selects, second click on the active cell edits or opens a picker', () => {
    expect(cellClickAction(null, { row: 0, col: 0 }, 'text')).toBe('select')
    expect(cellClickAction(sel(1, 1), { row: 0, col: 0 }, 'text')).toBe('select')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'text')).toBe('edit')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'number')).toBe('edit')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'select')).toBe('popover')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'multi-select')).toBe('popover')
  })
  it('checkbox and rating act on the first click; ranges, shift and read-only only select', () => {
    expect(cellClickAction(null, { row: 0, col: 0 }, 'checkbox')).toBe('toggle')
    expect(cellClickAction(null, { row: 0, col: 0 }, 'rating')).toBe('rate')
    const range = { anchor: { row: 0, col: 0 }, focus: { row: 1, col: 0 } }
    expect(cellClickAction(range, { row: 0, col: 0 }, 'text')).toBe('select')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'text', { extend: true })).toBe('select')
    expect(cellClickAction(sel(0, 0), { row: 0, col: 0 }, 'text', { readOnly: true })).toBe('select')
    expect(cellClickAction(null, { row: 0, col: 0 }, 'checkbox', { readOnly: true })).toBe('select')
  })
  it('rating click sets the star and clears on the same star', () => {
    expect(ratingFromPointer(4, null)).toBe(4)
    expect(ratingFromPointer(4, 4)).toBe(null)
    expect(ratingFromPointer(2, 5)).toBe(2)
  })
})

describe('options and duplicate', () => {
  it('adds a select option once, case-insensitively', () => {
    const f: FieldDef = { id: 's', name: 'S', type: 'select', options: [{ value: 'Unread' }] }
    expect(addFieldOption(f, 'Reading').options).toHaveLength(2)
    expect(addFieldOption(f, ' unread ')).toBe(f)
    expect(addFieldOption(f, '  ')).toBe(f)
  })
  it('duplicates a row under a new id without sharing arrays', () => {
    const row = { id: 'a', tags: ['x'] }
    const copy = duplicateRow(row, 'b')
    expect(copy).toEqual({ id: 'b', tags: ['x'] })
    expect(copy.tags).not.toBe(row.tags)
  })
})
