<script lang="ts" generics="TRow extends Record<string, unknown>">
  import { tick, untrack } from 'svelte'
  import { get } from 'svelte/store'
  import { createVirtualizer } from '@tanstack/svelte-virtual'
  import {
    IDLE, addField, addFieldOption, cellClickAction, duplicateRow, isPickerType, ratingFromPointer, sameCell, applyView, cellSelection, draftFromValue, duplicateField, editReducer,
    emptyFieldValue, emptyRow, isCellInSelection, navigateCells, normalizeRange, parseFieldValue, parseTsv,
    planFillDown, planPaste, planRetype, rangeCells, removeField, renameField, retypeField, setPrimaryField,
    toTsv, toggleFieldHidden, visibleFields, listFieldTypes,
    type CellAddress, type CellSelection, type DatasetOp, type FieldDef, type EditSession, type NavigationKey, type RetypeReport, type TableFieldType,
  } from '../../../core/table'
  import DatasetCell from './DatasetCell.svelte'
  import DatasetCellEditor from './DatasetCellEditor.svelte'
  import FieldMenu from './FieldMenu.svelte'
  import CellPopover from './CellPopover.svelte'
  import RowMenu from './RowMenu.svelte'
  import type { DatasetGridProps, FieldAction, RowAction } from './datasetTypes'

  let {
    fields, rows, view, label, idKey = 'id', height = 520, readOnly = false,
    onEdit, onViewChange, onFieldWidth, onOpenRecord, onUndo, onRedo, newRowId,
  }: DatasetGridProps<TRow> = $props()

  const uid = $props.id()
  const GUTTER = 64
  const GROUP_H = 32
  const ROW_H = { short: 32, medium: 56, tall: 88 } as const
  const LINES = { short: 1, medium: 2, tall: 4 } as const
  const WIDTH: Record<string, number> = {
    text: 220, 'long-text': 280, number: 110, select: 150, 'multi-select': 220, date: 130,
    checkbox: 96, rating: 120, url: 220, 'linked-record': 170,
  }
  const TYPE_GLYPH: Record<string, string> = {
    text: 'Aa', 'long-text': '¶', number: '#', select: '◉', 'multi-select': '☰', date: '▦', checkbox: '☑',
    rating: '★', url: '↗', 'linked-record': '⇄',
  }

  let sel = $state.raw<CellSelection | null>(null)
  let edit = $state.raw<EditSession>(IDLE)
  let menuFieldId = $state<string | null>(null)
  let adding = $state(false)
  let newName = $state('')
  let newType = $state<TableFieldType>('text')
  let pendingRetype = $state.raw<{ field: FieldDef; to: TableFieldType; report: RetypeReport } | null>(null)
  let status = $state('')
  let widths = $state<Record<string, number>>({})
  let scroller = $state<HTMLDivElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)
  let dragging = false
  let pressedActive = false
  let host = $state<HTMLDivElement | null>(null)
  let popover = $state.raw<{ cell: CellAddress; seed?: string } | null>(null)
  let menu = $state.raw<{ x: number; y: number } | null>(null)

  const result = $derived(applyView(rows, fields, view))
  const cols = $derived(visibleFields(fields, view))
  const dataRows = $derived(result.rows)
  const rowH = $derived(ROW_H[view.rowHeight])
  const items = $derived.by(() => {
    type Item = { kind: 'row'; row: TRow; index: number } | { kind: 'group'; key: string; label: string; count: number }
    const out: Item[] = []
    if (!result.groups) { dataRows.forEach((row, index) => out.push({ kind: 'row', row, index })); return out }
    let index = 0
    for (const g of result.groups) {
      out.push({ kind: 'group', key: g.key, label: g.label, count: g.rows.length })
      for (const row of g.rows) out.push({ kind: 'row', row, index: index++ })
    }
    return out
  })
  const widthOf = (f: FieldDef) => Math.max(72, widths[f.id] ?? f.width ?? WIDTH[f.type] ?? 160)
  const totalWidth = $derived(GUTTER + cols.reduce((sum, f) => sum + widthOf(f), 0) + 48)
  const idOf = (row: TRow) => String(row[idKey])
  const cellId = (r: number, c: number) => `${uid}-r${r}c${c}`
  const itemIndexOfRow = (r: number) => (result.groups ? items.findIndex((i) => i.kind === 'row' && i.index === r) : r)

  const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: 0, getScrollElement: () => scroller ?? null, estimateSize: () => 32, overscan: 8, initialRect: { width: 0, height: 520 },
  })
  $effect(() => {
    get(virtualizer).setOptions({
      count: items.length,
      getScrollElement: () => scroller,
      estimateSize: (i) => (items[i]?.kind === 'group' ? GROUP_H : rowH),
      overscan: 8,
      initialRect: { width: 0, height: height },
    })
  })
  const windowItems = $derived.by(() => {
    const v = $virtualizer.getVirtualItems()
    if (v.length) return v.map((x) => ({ index: x.index, start: x.start }))
    // jsdom / first paint: no measured viewport yet, render a leading window.
    const count = Math.min(items.length, Math.ceil(height / rowH) + 8)
    return Array.from({ length: count }, (_, index) => ({ index, start: index * rowH }))
  })
  const totalHeight = $derived($virtualizer.getTotalSize() || items.length * rowH)

  // ---- selection / reveal --------------------------------------------------
  $effect(() => {
    const focus = sel?.focus
    if (!focus) return
    untrack(() => reveal(focus))
  })

  function reveal(cell: CellAddress) {
    if (!scroller) return
    get(virtualizer).scrollToIndex(itemIndexOfRow(cell.row), { align: 'auto' })
    if (cell.col === 0) { scroller.scrollLeft = 0; return }
    let left = GUTTER
    for (let i = 0; i < cell.col; i++) left += widthOf(cols[i])
    const right = left + widthOf(cols[cell.col])
    const frozen = GUTTER + widthOf(cols[0])
    if (left < scroller.scrollLeft + frozen) scroller.scrollLeft = Math.max(0, left - frozen)
    else if (right > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = right - scroller.clientWidth
  }

  const dims = $derived({ rows: dataRows.length, cols: cols.length })
  const jsonEqual = (a: unknown, b: unknown) => Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b)
  const announce = (message: string) => { status = ''; void tick().then(() => (status = message)) }
  const focusGrid = () => root?.focus({ preventScroll: true })
  const activeCell = $derived(sel ? cellId(sel.anchor.row, sel.anchor.col) : undefined)

  function writeCells(writes: { row: number; col: number; value: unknown }[], labelText: string) {
    if (readOnly || !onEdit) return
    const ops: DatasetOp<TRow>[] = []
    for (const w of writes) {
      const row = dataRows[w.row]
      const f = cols[w.col]
      if (!row || !f || f.readOnly) continue
      if (jsonEqual(row[f.id], w.value)) continue
      ops.push({ kind: 'cell', rowId: idOf(row), field: f.id, before: row[f.id], after: w.value })
    }
    if (ops.length) onEdit(ops, labelText)
  }

  function writeDrafts(writes: { row: number; col: number; draft: string }[], labelText: string): number {
    let skipped = 0
    const parsed: { row: number; col: number; value: unknown }[] = []
    for (const w of writes) {
      const r = parseFieldValue(cols[w.col]?.type, w.draft)
      if (r.ok) parsed.push({ row: w.row, col: w.col, value: r.value })
      else skipped++
    }
    writeCells(parsed, labelText)
    return skipped
  }

  // ---- editing -------------------------------------------------------------
  function toggleCheckbox(cell: CellAddress) {
    const row = dataRows[cell.row]
    const f = cols[cell.col]
    if (!row || !f) return
    writeCells([{ ...cell, value: !row[f.id] }], `Toggle ${f.name}`)
  }

  function beginEdit(cell: CellAddress, seed?: string) {
    const f = cols[cell.col]
    const row = dataRows[cell.row]
    if (!f || !row || readOnly || f.readOnly || !onEdit) return
    if (popover || edit.phase !== 'idle') return
    if (f.type === 'checkbox') { toggleCheckbox(cell); return }
    if (isPickerType(f.type)) { popover = { cell, seed }; return }
    edit = editReducer(IDLE, { type: 'begin', cell, fieldType: f.type, value: row[f.id], seed })
  }

  function closePopover() { popover = null; void tick().then(focusGrid) }

  function commitPopover(cell: CellAddress, value: string | string[] | null, created?: string) {
    const f = cols[cell.col]
    const row = dataRows[cell.row]
    if (!f || !row) return
    const ops: DatasetOp<TRow>[] = []
    if (created) {
      const next = addFieldOption(f, created)
      if (next !== f) ops.push({ kind: 'schema', before: fields, after: fields.map((x) => (x.id === f.id ? next : x)) })
    }
    const after = value ?? emptyFieldValue(f.type)
    if (!jsonEqual(row[f.id], after)) ops.push({ kind: 'cell', rowId: idOf(row), field: f.id, before: row[f.id], after })
    if (ops.length && onEdit && !readOnly) onEdit(ops, `Edit ${f.name}`)
  }

  function finishCommit(move: NavigationKey | null, shift = false) {
    const session = edit
    if (session.phase !== 'editing') return
    const next = editReducer(session, { type: 'commit' })
    if (next.phase === 'error') { edit = next; return }
    const f = cols[session.cell.col]
    const parsed = parseFieldValue(f?.type, session.draft)
    if (parsed.ok && session.draft !== session.original) {
      writeCells([{ ...session.cell, value: parsed.value }], `Edit ${f.name}`)
    }
    edit = IDLE
    if (move && sel) sel = navigateCells(cellSelection(session.cell.row, session.cell.col), move, dims, { shift })
    void tick().then(focusGrid)
  }

  function cancelEdit() { edit = IDLE; void tick().then(focusGrid) }

  function onEditorKeydown(event: KeyboardEvent) {
    const multiline = cols[edit.phase === 'idle' ? 0 : edit.cell.col]?.type === 'long-text'
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelEdit() }
    else if (event.key === 'Enter' && !(multiline && event.shiftKey)) { event.preventDefault(); finishCommit('Enter', event.shiftKey) }
    else if (event.key === 'Tab') { event.preventDefault(); finishCommit('Tab', event.shiftKey) }
    event.stopPropagation()
  }

  // ---- keyboard / pointer ----------------------------------------------------
  const NAV = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'])

  function clearSelection() {
    if (!sel) return
    writeCells(rangeCells(sel).map((c) => ({ ...c, value: emptyFieldValue(cols[c.col]?.type) })), 'Clear cells')
  }

  function copyText(): string | null {
    if (!sel) return null
    const r = normalizeRange(sel)
    const matrix: string[][] = []
    for (let row = r.top; row <= r.bottom; row++) {
      matrix.push(cols.slice(r.left, r.right + 1).map((f) => draftFromValue(f.type, dataRows[row]?.[f.id])))
    }
    return toTsv(matrix)
  }

  function onKeydown(event: KeyboardEvent) {
    if (edit.phase !== 'idle' || event.target !== root) return
    const mod = event.ctrlKey || event.metaKey
    if (mod) {
      const k = event.key.toLowerCase()
      if (k === 'z') { event.preventDefault(); if (event.shiftKey) onRedo?.(); else onUndo?.(); return }
      if (k === 'y') { event.preventDefault(); onRedo?.(); return }
      if (k === 'a') { event.preventDefault(); sel = { anchor: { row: 0, col: 0 }, focus: { row: Math.max(0, dims.rows - 1), col: Math.max(0, dims.cols - 1) } }; return }
      if (k === 'd' && sel) {
        event.preventDefault()
        writeCells(planFillDown(sel).map((f) => ({ ...f.to, value: dataRows[f.from.row]?.[cols[f.from.col].id] })), 'Fill down')
        return
      }
      if (!NAV.has(event.key)) return
    }
    if (!sel) {
      if (NAV.has(event.key) || event.key === 'Enter') { event.preventDefault(); sel = cellSelection(0, 0) }
      return
    }
    if (NAV.has(event.key)) {
      const next = navigateCells(sel, event.key as NavigationKey, dims, { shift: event.shiftKey, mod })
      // Tab at either end leaves the grid, except past the last cell, which adds a record
      // (as in Notion and Excel tables). Navigation alone would wrap to the row's first cell.
      if (event.key === 'Tab') {
        const last = sel.anchor.row === dims.rows - 1 && sel.anchor.col === dims.cols - 1
        const first = sel.anchor.row === 0 && sel.anchor.col === 0
        if (event.shiftKey ? first : last) {
          if (!event.shiftKey && !readOnly && onEdit) { event.preventDefault(); void addRecord(true) }
          return
        }
      }
      event.preventDefault()
      sel = next
      return
    }
    const cell = sel.anchor
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) { event.preventDefault(); openMenuFromKeyboard() }
    else if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); beginEdit(cell) }
    else if (event.key === ' ' && event.shiftKey) { event.preventDefault(); const r = dataRows[cell.row]; if (r) onOpenRecord?.(idOf(r)) }
    else if (event.key === ' ' && cols[cell.col]?.type === 'checkbox') { event.preventDefault(); toggleCheckbox(cell) }
    else if (event.key === 'Escape') sel = cellSelection(cell.row, cell.col)
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); clearSelection() }
    else if (event.key.length === 1 && !mod && !event.altKey) {
      event.preventDefault()
      const f = cols[cell.col]
      if (f?.type === 'rating') {
        if (/^[0-5]$/.test(event.key)) writeDrafts([{ ...cell, draft: event.key }], `Rate ${f.name}`)
      } else beginEdit(cell, event.key)
    }
  }

  function onCopy(event: ClipboardEvent) {
    if (edit.phase !== 'idle') return
    const text = copyText()
    if (text == null) return
    event.preventDefault()
    event.clipboardData?.setData('text/plain', text)
    announce('Copied')
  }
  function onCut(event: ClipboardEvent) {
    if (edit.phase !== 'idle' || readOnly) return
    onCopy(event)
    clearSelection()
  }
  function onPaste(event: ClipboardEvent) {
    if (edit.phase !== 'idle' || !sel || readOnly) return
    const text = event.clipboardData?.getData('text/plain')
    if (!text) return
    event.preventDefault()
    const writes = planPaste(sel, parseTsv(text), dims)
    const skipped = writeDrafts(writes, 'Paste')
    announce(skipped ? `Pasted ${writes.length - skipped} cells, skipped ${skipped} that did not fit the field type` : `Pasted ${writes.length} cells`)
  }

  function onCellPointerDown(event: PointerEvent, r: number, c: number) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    // Pointer events inside an open editor or popover belong to it (caret placement, option clicks).
    if (target.closest('input, textarea, select, .pop')) return
    pressedActive = false
    if (edit.phase !== 'idle') finishCommit(null)
    if (popover) return
    const f = cols[c]
    const locked = readOnly || !onEdit || Boolean(f?.readOnly)
    const action = cellClickAction(sel, { row: r, col: c }, f?.type, { readOnly: locked, extend: event.shiftKey })
    if (action === 'toggle' && target.closest('.check')) {
      sel = cellSelection(r, c)
      toggleCheckbox({ row: r, col: c })
      focusGrid()
      return
    }
    if (action === 'rate') {
      sel = cellSelection(r, c)
      const star = target.closest<HTMLElement>('[data-star]')
      if (star && f) writeCells([{ row: r, col: c, value: ratingFromPointer(Number(star.dataset.star), dataRows[r]?.[f.id]) }], `Rate ${f.name}`)
      focusGrid()
      return
    }
    pressedActive = action === 'edit' || action === 'popover'
    sel = event.shiftKey && sel ? { anchor: sel.anchor, focus: { row: r, col: c } } : cellSelection(r, c)
    dragging = true
    focusGrid()
    const stop = () => { dragging = false; window.removeEventListener('pointerup', stop) }
    window.addEventListener('pointerup', stop)
  }
  /** Clicking the already-active cell opens its editor; a drag or shift-click never does. */
  function onCellClick(event: MouseEvent, r: number, c: number) {
    if (!pressedActive) return
    pressedActive = false
    if (event.shiftKey || (event.target as HTMLElement).closest('a, input, textarea, select, .pop')) return
    if (!sel || !sameCell(sel.anchor, { row: r, col: c }) || !sameCell(sel.focus, { row: r, col: c })) return
    beginEdit({ row: r, col: c })
  }
  function onCellPointerEnter(r: number, c: number) {
    if (dragging && sel) sel = { anchor: sel.anchor, focus: { row: r, col: c } }
  }
  function selectRow(r: number) {
    sel = { anchor: { row: r, col: 0 }, focus: { row: r, col: Math.max(0, dims.cols - 1) } }
    focusGrid()
  }

  // ---- schema / view actions -------------------------------------------------
  function schemaOp(next: FieldDef[], labelText: string, extra: DatasetOp<TRow>[] = []) {
    if (readOnly || !onEdit) return
    onEdit([{ kind: 'schema', before: fields, after: next }, ...extra], labelText)
  }

  function applyRetype(field: FieldDef, to: TableFieldType, report: RetypeReport) {
    const ops: DatasetOp<TRow>[] = []
    for (const row of rows) {
      const after = report.values.get(idOf(row))
      if (!jsonEqual(row[field.id], after)) ops.push({ kind: 'cell', rowId: idOf(row), field: field.id, before: row[field.id], after })
    }
    schemaOp(retypeField(fields, field.id, to), `Change ${field.name} to ${to}`, ops)
    pendingRetype = null
  }

  function onFieldAction(field: FieldDef, action: FieldAction) {
    switch (action.kind) {
      case 'rename': schemaOp(renameField(fields, field.id, action.name), `Rename ${field.name}`); break
      case 'retype': {
        if (action.type === field.type) break
        const report = planRetype(rows, idOf, field, action.type)
        if (report.cleared > 0) pendingRetype = { field, to: action.type, report }
        else applyRetype(field, action.type, report)
        break
      }
      case 'sort': onViewChange?.({ ...view, sorts: [{ field: field.id, desc: action.desc }] }); break
      case 'group': onViewChange?.({ ...view, groupBy: view.groupBy === field.id ? undefined : field.id }); break
      case 'filter':
        onViewChange?.({ ...view, filters: [...view.filters, { id: `filter-${Date.now().toString(36)}`, field: field.id, operator: 'contains', value: '' }] })
        break
      case 'hide': onViewChange?.(toggleFieldHidden(view, field.id, fields[0]?.id)); break
      case 'duplicate': {
        const next = duplicateField(fields, field.id)
        const copy = next.find((f) => !fields.some((o) => o.id === f.id))
        const ops: DatasetOp<TRow>[] = copy
          ? rows.filter((r) => r[field.id] != null).map((r) => ({ kind: 'cell' as const, rowId: idOf(r), field: copy.id, before: undefined, after: r[field.id] }))
          : []
        schemaOp(next, `Duplicate ${field.name}`, ops)
        break
      }
      case 'primary': schemaOp(setPrimaryField(fields, field.id), `Make ${field.name} primary`); break
      case 'delete': schemaOp(removeField(fields, field.id), `Delete ${field.name}`); break
    }
  }

  function createField(event: SubmitEvent) {
    event.preventDefault()
    schemaOp(addField(fields, newName || 'Field', newType), `Add ${newName || 'field'}`)
    adding = false
    newName = ''
    newType = 'text'
  }

  const mintId = () => newRowId?.() ?? (globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  async function addRecord(startEditing = false) {
    if (readOnly || !onEdit) return
    const id = mintId()
    onEdit([{ kind: 'insert-row', row: emptyRow(fields, id, idKey) as TRow, index: rows.length }], 'Add record')
    await tick()
    const r = dataRows.findIndex((row) => idOf(row) === id)
    if (r >= 0) {
      sel = cellSelection(r, 0)
      focusGrid()
      await tick()
      if (startEditing) beginEdit({ row: r, col: 0 })
    }
    announce('Record added')
  }

  // ---- row menu ----------------------------------------------------------------
  const rowIndexOf = (row: TRow) => rows.findIndex((x) => idOf(x) === idOf(row))
  const menuRange = $derived(sel ? normalizeRange(sel) : null)
  const menuCount = $derived(menuRange ? menuRange.bottom - menuRange.top + 1 : 1)

  function placeMenu(clientX: number, clientY: number) {
    const box = host?.getBoundingClientRect()
    menu = { x: clientX - (box?.left ?? 0), y: clientY - (box?.top ?? 0) }
  }
  function openMenu(event: MouseEvent, r: number) {
    event.preventDefault()
    if (edit.phase !== 'idle') finishCommit(null)
    const range = sel ? normalizeRange(sel) : null
    if (!range || r < range.top || r > range.bottom) sel = cellSelection(r, sel?.anchor.col ?? 0)
    placeMenu(event.clientX, event.clientY)
  }
  function openMenuFromKeyboard() {
    if (!sel) return
    const el = root?.querySelector<HTMLElement>(`#${CSS.escape(cellId(sel.anchor.row, sel.anchor.col))}`)
    const box = el?.getBoundingClientRect()
    placeMenu((box?.left ?? 0) + 24, (box?.bottom ?? 0) - 4)
  }

  function runRowAction(action: RowAction) {
    const range = sel ? normalizeRange(sel) : null
    if (!range) return
    const targets = dataRows.slice(range.top, range.bottom + 1)
    if (!targets.length) return
    const first = rowIndexOf(targets[0])
    const last = rowIndexOf(targets[targets.length - 1])
    const noun = targets.length > 1 ? `${targets.length} records` : 'record'
    if (action === 'insert-above' || action === 'insert-below') {
      const id = mintId()
      onEdit?.([{ kind: 'insert-row', row: emptyRow(fields, id, idKey) as TRow, index: action === 'insert-above' ? first : last + 1 }], 'Insert record')
    } else if (action === 'duplicate') {
      onEdit?.(targets.map((row, k) => ({ kind: 'insert-row' as const, row: duplicateRow(row, mintId(), idKey), index: last + 1 + k })), `Duplicate ${noun}`)
    } else if (action === 'clear') {
      const writes: { row: number; col: number; value: unknown }[] = []
      for (let r = range.top; r <= range.bottom; r++) cols.forEach((f, col) => writes.push({ row: r, col, value: emptyFieldValue(f.type) }))
      writeCells(writes, `Clear ${noun}`)
    } else if (action === 'copy') {
      const text = toTsv(targets.map((row) => cols.map((f) => draftFromValue(f.type, row[f.id]))))
      void navigator.clipboard?.writeText(text)
      announce(`Copied ${noun}`)
    } else if (action === 'delete') {
      // Highest index first: undo replays the inverse in reverse, which re-inserts lowest first.
      const ops = targets.map((row) => ({ kind: 'remove-row' as const, row, index: rowIndexOf(row) })).sort((a, b) => b.index - a.index)
      onEdit?.(ops, `Delete ${noun}`)
      sel = null
    }
    void tick().then(focusGrid)
  }

  function beginResize(event: PointerEvent, f: FieldDef) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    const startX = event.clientX
    const startW = widthOf(f)
    target.setPointerCapture?.(event.pointerId)
    const move = (e: PointerEvent) => { widths = { ...widths, [f.id]: Math.max(72, startW + e.clientX - startX) } }
    const end = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', end)
      onFieldWidth?.(f.id, widthOf(f))
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', end)
  }
  function resizeKey(event: KeyboardEvent, f: FieldDef) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const w = Math.max(72, widthOf(f) + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 32 : 8))
    widths = { ...widths, [f.id]: w }
    onFieldWidth?.(f.id, w)
  }

  const overlayRow = $derived(popover ? popover.cell.row : edit.phase !== 'idle' ? edit.cell.row : -1)
  const sortOf = (f: FieldDef) => view.sorts.find((s) => s.field === f.id)
  const issue = $derived(edit.phase === 'editing' || edit.phase === 'error' ? edit.issue : null)
  const editLabel = (f: FieldDef, row: TRow) => `${f.name} for ${String(row[fields[0]?.id] ?? 'record')}`
</script>

<div class="dataset" bind:this={host} style:--ds-lines={LINES[view.rowHeight]} style:--ds-chip-wrap={view.rowHeight === 'short' ? 'nowrap' : 'wrap'}>
  {#if pendingRetype}
    <div class="notice" role="alertdialog" aria-label="Confirm type change">
      <span><strong>{pendingRetype.report.cleared.toLocaleString()}</strong> values in “{pendingRetype.field.name}” cannot be read as {pendingRetype.to} and will be cleared. You can undo this.</span>
      <button type="button" onclick={() => pendingRetype && applyRetype(pendingRetype.field, pendingRetype.to, pendingRetype.report)}>Convert anyway</button>
      <button type="button" onclick={() => (pendingRetype = null)}>Cancel</button>
    </div>
  {/if}

  <div class="scroller" data-grid-scroller bind:this={scroller} style:height="{height}px">
    <div
      class="grid" bind:this={root} role="grid" tabindex="0" aria-label={label} aria-rowcount={dataRows.length + 1}
      aria-colcount={cols.length + 1} aria-multiselectable="true" aria-activedescendant={activeCell} aria-readonly={readOnly || undefined}
      style:width="{totalWidth}px" onkeydown={onKeydown} oncopy={onCopy} oncut={onCut} onpaste={onPaste}
    >
      <div class="head" role="row" aria-rowindex="1">
        <div class="gutter corner" role="columnheader" aria-label="Row"></div>
        {#each cols as f, c (f.id)}
          {@const sort = sortOf(f)}
          <div
            class="th" class:primary={c === 0} role="columnheader" aria-colindex={c + 2} style:width="{widthOf(f)}px"
            aria-sort={sort ? (sort.desc ? 'descending' : 'ascending') : undefined}
          >
            <button
              type="button" class="th-btn" aria-haspopup="menu" aria-expanded={menuFieldId === f.id}
              onclick={() => (menuFieldId = menuFieldId === f.id ? null : f.id)}
            >
              <span class="glyph" aria-hidden="true">{TYPE_GLYPH[f.type] ?? '·'}</span>
              <span class="name">{f.name}</span>
              {#if sort}<span class="sort" aria-hidden="true">{sort.desc ? '↓' : '↑'}</span>{/if}
            </button>
            <!-- A focusable separator is the ARIA window-splitter pattern. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
            <div
              class="resizer" role="separator" aria-orientation="vertical" aria-label={`Resize ${f.name}`} aria-valuenow={widthOf(f)}
              tabindex="0" onpointerdown={(e) => beginResize(e, f)} onkeydown={(e) => resizeKey(e, f)}
            ></div>
            {#if menuFieldId === f.id}
              <FieldMenu field={f} isPrimary={c === 0} {readOnly} onAction={(a) => onFieldAction(f, a)} onClose={() => { menuFieldId = null; focusGrid() }} />
            {/if}
          </div>
        {/each}
        {#if !readOnly}
          <div class="th add" role="columnheader" aria-label="Add field">
            <button type="button" class="th-btn" aria-label="Add field" aria-expanded={adding} onclick={() => (adding = !adding)}>＋</button>
            {#if adding}
              <form class="add-form" onsubmit={createField}>
                <label>Field name<input bind:value={newName} placeholder="Field" autocomplete="off" /></label>
                <label>Type<select class="tint-select" bind:value={newType}>{#each listFieldTypes().filter((t) => t !== 'computed') as t (t)}<option value={t}>{t}</option>{/each}</select></label>
                <div class="actions"><button type="submit">Create field</button><button type="button" onclick={() => (adding = false)}>Cancel</button></div>
              </form>
            {/if}
          </div>
        {/if}
      </div>

      <div class="body" role="rowgroup" style:height="{totalHeight + (readOnly ? 0 : rowH)}px">
        {#each windowItems as w (w.index)}
          {@const item = items[w.index]}
          {#if item?.kind === 'group'}
            <div class="group" role="row" style:transform="translateY({w.start}px)" style:height="{GROUP_H}px">
              <div role="gridcell" class="group-cell" aria-colspan={cols.length + 1}>{item.label} <span class="count">{item.count.toLocaleString()}</span></div>
            </div>
          {:else if item}
            {@const r = item.index}
            <div class="row" class:overlay={overlayRow === r} role="row" aria-rowindex={r + 2} style:transform="translateY({w.start}px)" style:height="{rowH}px">
              <!-- The context menu is also reachable from the keyboard (ContextMenu / Shift+F10 on the grid). -->
              <!-- svelte-ignore a11y_interactive_supports_focus -->
              <div class="gutter" role="rowheader" oncontextmenu={(e) => openMenu(e, r)}>
                <button type="button" class="num" aria-label={`Select row ${r + 1}`} onclick={() => selectRow(r)}>{r + 1}</button>
                <button type="button" class="expand" aria-label={`Open record ${r + 1}`} onclick={() => onOpenRecord?.(idOf(item.row))}>⤢</button>
              </div>
              {#each cols as f, c (f.id)}
                {@const active = sel != null && sel.anchor.row === r && sel.anchor.col === c}
                {@const editing = (edit.phase === 'editing' || edit.phase === 'error' || edit.phase === 'committing') && edit.cell.row === r && edit.cell.col === c}
                <!-- Focus stays on the grid root (aria-activedescendant), so cells are deliberately not tabbable. -->
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
                <div
                  id={cellId(r, c)} role="gridcell" class="td" class:primary={c === 0} class:active class:editing
                  class:end={f.type === 'number'} aria-colindex={c + 2} aria-selected={isCellInSelection(sel, { row: r, col: c })}
                  aria-readonly={f.readOnly || undefined}
                  data-selected={isCellInSelection(sel, { row: r, col: c }) || undefined}
                  data-invalid={editing && issue?.state === 'invalid' ? '' : undefined}
                  data-warn={editing && issue?.state === 'warn' ? '' : undefined}
                  data-readonly={f.readOnly || readOnly || undefined}
                  style:width="{widthOf(f)}px"
                  data-picker={isPickerType(f.type) || undefined} aria-haspopup={isPickerType(f.type) ? 'listbox' : undefined}
                  class:popping={popover != null && popover.cell.row === r && popover.cell.col === c}
                  onpointerdown={(e) => onCellPointerDown(e, r, c)} onpointerenter={() => onCellPointerEnter(r, c)}
                  onclick={(e) => onCellClick(e, r, c)} oncontextmenu={(e) => openMenu(e, r)}
                  ondblclick={() => beginEdit({ row: r, col: c })}
                >
                  {#if popover && popover.cell.row === r && popover.cell.col === c}
                    <DatasetCell field={f} value={item.row[f.id]} />
                    <CellPopover
                      field={f} value={item.row[f.id]} initialQuery={popover.seed ?? ''} label={editLabel(f, item.row)}
                      onCommit={(v, created) => commitPopover(popover!.cell, v, created)} onClose={closePopover}
                    />
                  {:else if editing && edit.phase !== 'idle'}
                    <DatasetCellEditor
                      field={f} draft={edit.draft} messageId={`${cellId(r, c)}-msg`} invalid={issue?.state === 'invalid'}
                      label={editLabel(f, item.row)} selectOnOpen={edit.draft === edit.original}
                      onInput={(d) => (edit = editReducer(edit, { type: 'input', draft: d }))}
                      onPick={(d) => { edit = editReducer(edit, { type: 'input', draft: d }); finishCommit(null) }}
                      onKeydown={onEditorKeydown}
                      onBlur={() => finishCommit(null)}
                    />
                    {#if issue}<span class="msg" id={`${cellId(r, c)}-msg`} role={issue.state === 'invalid' ? 'alert' : 'status'}>{issue.message}</span>{/if}
                  {:else}
                    <DatasetCell field={f} value={item.row[f.id]} />
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/each}
        {#if !readOnly}
          <div class="row addrow" role="row" style:transform="translateY({totalHeight}px)" style:height="{rowH}px">
            <div class="gutter" role="rowheader"></div>
            <div role="gridcell" class="addcell"><button type="button" tabindex="-1" aria-label="Add record" onclick={() => addRecord(true)}>＋ New record</button></div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if menu}
    <RowMenu x={menu.x} y={menu.y} count={menuCount} {readOnly} onAction={runRowAction} onClose={() => { menu = null; void tick().then(focusGrid) }} />
  {/if}

  <footer class="foot">
    {#if !readOnly}<button type="button" class="new" onclick={() => addRecord(true)}>＋ New record</button>{/if}
    <span>{dataRows.length.toLocaleString()}{dataRows.length === rows.length ? '' : ` of ${rows.length.toLocaleString()}`} records</span>
    <span class="hint">Arrows move · Enter edits · Ctrl+Z undoes · Shift+Space opens a record</span>
  </footer>
  <div class="sr" role="status" aria-live="polite">{status}</div>
</div>

<style>
  .dataset { position: relative; display: grid; gap: .5rem; min-width: 0; font-size: var(--tint-font-size-sm); color: var(--tint-ink); }
  .scroller { overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); position: relative; }
  .grid { position: relative; outline: none; min-height: 100%; }
  .grid:focus-visible { outline: var(--tint-focus-width, 2px) solid var(--tint-focus); outline-offset: -2px; }

  .head { position: sticky; top: 0; z-index: 12; display: flex; height: 36px; background: var(--tint-surface); border-bottom: 1px solid var(--tint-border-strong); }
  .th { position: relative; flex: none; display: flex; border-inline-end: 1px solid var(--tint-border); font-weight: 600; }
  .th.primary, .gutter { position: sticky; z-index: 11; background: var(--tint-surface); }
  .th.primary { inset-inline-start: 64px; }
  .th.add { flex: none; width: 48px; }
  .th-btn {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: .375rem; padding: 0 .75rem; font: inherit; color: var(--tint-ink);
    background: none; border: 0; cursor: pointer; text-align: start; outline-offset: -2px;
  }
  .th-btn:hover { background: var(--tint-accent-soft); }
  .th-btn:focus-visible { outline: 2px solid var(--tint-focus); }
  .glyph { color: var(--tint-muted); font-size: var(--tint-font-size-xs); width: 1.25rem; flex: none; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sort { color: var(--tint-accent); }
  .resizer { position: absolute; inset-block: 0; inset-inline-end: -3px; width: 7px; cursor: col-resize; z-index: 2; outline-offset: -2px; }
  .resizer:hover, .resizer:focus-visible { background: color-mix(in srgb, var(--tint-accent) 40%, transparent); outline: none; }
  .add-form {
    position: absolute; z-index: 30; top: 100%; inset-inline-end: 0; width: 16rem; display: grid; gap: .5rem; padding: .75rem;
    background: var(--tint-panel); border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-md);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--tint-shadow-color, #000) 22%, transparent); font-weight: 400;
  }
  .add-form label { display: grid; gap: .125rem; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  .add-form input, .add-form select { font: inherit; color: var(--tint-ink); background: var(--tint-field); border: 0; border-bottom: 1px solid var(--tint-border-strong); padding: .375rem .5rem; outline-offset: -2px; }
  .add-form input:focus-visible, .add-form select:focus-visible { outline: 2px solid var(--tint-focus); }
  .actions { display: flex; gap: .5rem; }
  .actions button, .notice button, .new {
    font: inherit; color: var(--tint-ink); background: var(--tint-panel); border: 1px solid var(--tint-border-strong);
    border-radius: var(--tint-radius-sm); padding: .25rem .625rem; cursor: pointer;
  }
  .actions button:first-child { background: var(--tint-accent); color: var(--tint-on-accent, #fff); border-color: var(--tint-accent); }

  .body { position: relative; }
  .row, .group { position: absolute; inset-inline-start: 0; top: 0; display: flex; width: 100%; will-change: transform; }
  .row { border-bottom: 1px solid var(--tint-border); }
  .row.overlay { z-index: 30; }
  .row:hover .td { background: color-mix(in srgb, var(--tint-accent-soft) 55%, var(--tint-panel)); }
  .group { background: var(--tint-surface); border-bottom: 1px solid var(--tint-border); font-weight: 600; }
  .group-cell { position: sticky; inset-inline-start: 0; padding: 0 .75rem; display: flex; align-items: center; gap: .5rem; }
  .count { color: var(--tint-muted); font-weight: 400; font-size: var(--tint-font-size-xs); }

  .gutter { flex: none; inset-inline-start: 0; width: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 .25rem; border-inline-end: 1px solid var(--tint-border); }
  .gutter button { font: inherit; background: none; border: 0; color: var(--tint-muted); cursor: pointer; border-radius: var(--tint-radius-sm); padding: .125rem .375rem; outline-offset: -2px; }
  .gutter button:hover { color: var(--tint-ink); background: var(--tint-accent-soft); }
  .gutter button:focus-visible { outline: 2px solid var(--tint-focus); }
  .num { font-variant-numeric: tabular-nums; font-size: var(--tint-font-size-xs); }
  .expand { opacity: 0; }
  .row:hover .expand, .expand:focus-visible { opacity: 1; }
  .row .gutter { background: var(--tint-surface); }

  /* Fluid-style cell: the container owns fill and state, the editor inside is transparent,
     and focus/invalid outlines sit inset so neighbours never shift or clip. */
  .td {
    position: relative; flex: none; display: flex; align-items: center; padding: 0 .75rem; min-width: 0; overflow: hidden;
    border-inline-end: 1px solid var(--tint-border); background: transparent; user-select: none;
    transition: background-color 70ms cubic-bezier(.2, 0, .38, .9), outline-color 70ms cubic-bezier(.2, 0, .38, .9);
  }
  .td.primary { position: sticky; inset-inline-start: 64px; z-index: 5; background: var(--tint-panel); font-weight: 500; }
  .td:hover:not(.active):not(.editing):not([data-readonly]) { outline: 1px solid var(--tint-border-strong); outline-offset: -1px; cursor: cell; }
  .td.popping { overflow: visible; z-index: 20; }
  .td.active[data-picker]::after { content: '▾'; margin-inline-start: auto; padding-inline-start: .5rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); flex: none; }
  .addrow { background: transparent; border-bottom: 0; }
  .addrow .gutter { background: var(--tint-surface); }
  .addcell { position: sticky; inset-inline-start: 64px; display: flex; align-items: center; padding: 0 .5rem; }
  .addcell button { font: inherit; color: var(--tint-muted); background: none; border: 0; padding: .25rem .5rem; border-radius: var(--tint-radius-sm); cursor: pointer; }
  .addcell button:hover { color: var(--tint-ink); background: var(--tint-accent-soft); }
  .td.end { justify-content: flex-end; }
  .td[data-selected] { background: color-mix(in srgb, var(--tint-accent) 12%, var(--tint-panel)); }
  .td.active { outline: 2px solid var(--tint-focus); outline-offset: -2px; background: var(--tint-panel); z-index: 6; }
  .td[data-readonly] { color: var(--tint-muted); }
  .td.editing { overflow: visible; background: var(--tint-field); z-index: 20; padding: 0; }
  .td[data-invalid] { outline: 2px solid var(--tint-danger); outline-offset: -2px; }
  .td[data-warn] { outline: 2px dotted var(--tint-warning); outline-offset: -2px; }
  .td :global(input), .td :global(select), .td :global(textarea) {
    width: 100%; height: 100%; min-height: 100%; box-sizing: border-box; font: inherit; color: var(--tint-ink); background: transparent;
    border: 0; padding: 0 .75rem; outline: none; user-select: text;
  }
  .td :global(textarea) { position: absolute; inset-inline-start: 0; top: 0; min-height: 5.5rem; padding: .5rem .75rem; background: var(--tint-field); resize: none; outline: 2px solid var(--tint-focus); outline-offset: -2px; }
  .msg {
    position: absolute; top: 100%; inset-inline-start: 0; min-width: 100%; width: max-content; max-width: 18rem; padding: .25rem .625rem; z-index: 25;
    font-size: var(--tint-font-size-xs); background: var(--tint-danger-soft); color: var(--tint-danger-ink); border: 1px solid var(--tint-danger); border-top: 0;
  }
  [data-warn] .msg { background: var(--tint-warning-soft); color: var(--tint-warning-ink); border-color: var(--tint-warning); }

  .notice { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; padding: .5rem .75rem; background: var(--tint-warning-soft); color: var(--tint-warning-ink); border: 1px solid var(--tint-warning); border-radius: var(--tint-radius-sm); }
  .notice span { flex: 1 1 18rem; }
  .foot { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .new:hover { background: var(--tint-accent-soft); }
  .hint { margin-inline-start: auto; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .td { transition: none; } }
</style>
