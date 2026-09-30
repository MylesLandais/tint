<script lang="ts" generics="TRow">
  import { tick } from 'svelte'
  import { get } from 'svelte/store'
  import { createVirtualizer } from '@tanstack/svelte-virtual'
  import { createTableRow, deleteTableRow, normalizeTableError, updateTableCell } from '../../../core/table/commands'
  import { getCellValue, nextSort, visibleColumns } from '../../../core/table/derive'
  import { formatFieldValue, resolveFieldType } from '../../../core/table/fieldTypes'
  import { workbenchLayout } from '../../../core/table/layout'
  import {
    isRowSelected,
    selectMatchingQuery,
    toggleRowSelection,
    toggleVisibleSelection,
    toSelectionChange,
    type TableSelectionModel,
  } from '../../../core/table/selection'
  import type { TableResizeAxis, TableRowId } from '../../../core/table/types'
  import type { DataTableProps, TableColumn } from './types'

  let {
    rows: rowsProp, table, tableVersion, columns, rowId, label, caption, density = 'comfortable', emptyState,
    rowHeaderColumn, sort, onSortChange, selection, onSelectionChange,
    selectionModel, onSelectionModelChange, selectionQueryKey, selectionLabel,
    expanded, onExpandedChange, renderExpanded, hiddenColumns = [],
    resizing, columnWidths, rowHeights, onColumnWidthsChange, onRowHeightsChange,
    onResize, editing, activeRowId, onActiveRowChange, virtual = false,
    virtualHeight = 480, workbenchResponsive = false, class: className,
  }: DataTableProps<TRow> = $props()

  const ROW_HEIGHT = { compact: 28, comfortable: 40, spacious: 52 } as const
  let rows = $derived.by(() => {
    void tableVersion
    return table ? table.getRowModel().rows.map((row) => row.original) : (rowsProp ?? [])
  })
  let viewport = $state<HTMLDivElement | null>(null)
  let measuredWidth = $state(0)
  let scrolledRight = $state(false)
  let localColumnWidths = $state<Record<string, number>>({})
  let localRowHeights = $state<Record<string, number>>({})
  let editBusy = $state(false)
  let activeEdit = $state<{ rowId: string; columnId: string; draft: string; pending: boolean } | null>(null)

  const idOf = (row: TRow): TableRowId => typeof rowId === 'function' ? rowId(row) : String(row[rowId])
  const headerLabel = (column: TableColumn<TRow>): string =>
    column.label ?? (typeof column.header === 'string' ? column.header : column.id)
  const widthFor = (column: TableColumn<TRow>) => resolvedColumnWidths[column.id] ?? column.width

  let autoHidden = $derived(workbenchResponsive && measuredWidth > 0
    ? workbenchLayout(measuredWidth).hiddenColumns : [])
  let effectiveHidden = $derived([...new Set([...hiddenColumns, ...autoHidden])])
  let shown = $derived(visibleColumns(columns, effectiveHidden))
  let resolvedColumnWidths = $derived(columnWidths ?? localColumnWidths)
  let resolvedRowHeights = $derived(rowHeights ?? localRowHeights)
  let selectable = $derived(Boolean((selection !== undefined && onSelectionChange) || (selectionModel && onSelectionModelChange)))
  let expandable = $derived(Boolean(expanded && onExpandedChange && renderExpanded))
  let headerColumn = $derived(rowHeaderColumn ?? shown[0]?.id)
  let selectionForPage = $derived.by((): TableSelectionModel => {
    if (selectionModel && onSelectionModelChange) {
      if (selectionModel.mode === 'query' && selectionQueryKey !== selectionModel.queryKey) return { mode: 'ids', ids: [] }
      return selectionModel
    }
    return { mode: 'ids', ids: selection ?? [] }
  })
  let allSelected = $derived(rows.length > 0 && rows.every((row) => isRowSelected(selectionForPage, idOf(row))))
  let offsets = $derived.by(() => {
    const value = new Map<string, number>()
    let left = selectable ? 44 : 0
    for (const column of shown) {
      if (!column.pinned) continue
      value.set(column.id, left)
      left += widthFor(column) ?? 96
    }
    return value
  })
  let columnSpan = $derived(shown.length + Number(selectable) + Number(expandable))
  let virtualActive = $derived(virtual && !expanded?.length && !resizing?.rows && !Object.keys(resolvedRowHeights).length)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: 0,
    getScrollElement: () => viewport ?? null,
    estimateSize: () => ROW_HEIGHT[density],
    getItemKey: (index) => rows[index] ? idOf(rows[index]) : index,
    initialRect: { width: 0, height: 480 },
    overscan: 6,
  })

  $effect(() => {
    get(rowVirtualizer).setOptions({
      count: rows.length,
      getScrollElement: () => viewport,
      estimateSize: () => ROW_HEIGHT[density],
      getItemKey: (index) => rows[index] ? idOf(rows[index]) : index,
      initialRect: { width: measuredWidth, height: virtualHeight },
    })
  })

  let virtualItems = $derived($rowVirtualizer.getVirtualItems())
  let initialWindowCount = $derived(Math.min(rows.length, Math.ceil(virtualHeight / ROW_HEIGHT[density]) + 6))
  let renderIndexes = $derived(virtualActive
    ? virtualItems.length ? virtualItems.map((item) => item.index) : Array.from({ length: initialWindowCount }, (_, index) => index)
    : rows.map((_, index) => index))
  let topPad = $derived(virtualActive ? (virtualItems[0]?.start ?? 0) : 0)
  let bottomPad = $derived(virtualActive
    ? Math.max(0, $rowVirtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? initialWindowCount * ROW_HEIGHT[density])) : 0)

  $effect(() => {
    const element = viewport
    if (!element) return
    const measure = () => { measuredWidth = element.clientWidth; scrolledRight = element.scrollLeft > 0 }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  })

  function rowLabel(row: TRow): string {
    if (selectionLabel) return selectionLabel(row)
    const column = shown.find((candidate) => candidate.id === headerColumn)
    return column ? String(getCellValue(row, column) ?? idOf(row)) : idOf(row)
  }

  function setColumnWidth(id: string, size: number) {
    const next = { ...resolvedColumnWidths, [id]: size }
    if (columnWidths === undefined) localColumnWidths = next
    onColumnWidthsChange?.(next)
  }

  function setRowHeight(id: string, size: number) {
    const next = { ...resolvedRowHeights, [id]: size }
    if (rowHeights === undefined) localRowHeights = next
    onRowHeightsChange?.(next)
  }

  function applyResize(axis: TableResizeAxis, id: string, size: number, phase: 'start' | 'move' | 'end') {
    if (phase !== 'start') {
      if (axis === 'column') setColumnWidth(id, size)
      else setRowHeight(id, size)
    }
    onResize?.({ axis, id, size, phase })
  }

  function beginResize(event: PointerEvent, axis: TableResizeAxis, id: string, initial: number, minimum: number) {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    const start = axis === 'column' ? event.clientX : event.clientY
    applyResize(axis, id, initial, 'start')
    target.setPointerCapture?.(event.pointerId)
    const sizeAt = (next: PointerEvent) => Math.max(minimum, initial +
      (axis === 'column' ? next.clientX : next.clientY) - start)
    const move = (next: PointerEvent) => applyResize(axis, id, sizeAt(next), 'move')
    const end = (next: PointerEvent) => {
      applyResize(axis, id, sizeAt(next), 'end')
      target.releasePointerCapture?.(next.pointerId)
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', end)
      target.removeEventListener('pointercancel', end)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', end)
    target.addEventListener('pointercancel', end)
  }

  function resizeKey(event: KeyboardEvent, axis: TableResizeAxis, id: string, size: number, minimum: number) {
    const grow = axis === 'column' ? 'ArrowRight' : 'ArrowDown'
    const shrink = axis === 'column' ? 'ArrowLeft' : 'ArrowUp'
    if (event.key !== grow && event.key !== shrink) return
    event.preventDefault()
    const delta = (event.shiftKey ? 32 : 8) * (event.key === grow ? 1 : -1)
    applyResize(axis, id, Math.max(minimum, size + delta), 'end')
  }

  function toggleOne(id: string) {
    if (selectionModel && onSelectionModelChange) {
      onSelectionModelChange(toggleRowSelection(selectionForPage, id))
    } else if (selection && onSelectionChange) {
      onSelectionChange(toSelectionChange(selection, [], id))
    }
  }

  function toggleVisible() {
    const ids = rows.map(idOf)
    if (selectionModel && onSelectionModelChange) {
      onSelectionModelChange(toggleVisibleSelection(selectionForPage, ids))
    } else if (selection && onSelectionChange) {
      onSelectionChange(toSelectionChange(selection, ids, null))
    }
  }

  function toggleExpanded(id: string) {
    if (!expanded || !onExpandedChange) return
    onExpandedChange(expanded.includes(id) ? expanded.filter((value) => value !== id) : [...expanded, id], id)
  }

  async function createRow() {
    if (!editing?.adapter.create || editBusy) return
    editBusy = true
    try {
      editing.onCreate?.(await createTableRow(editing.adapter.create, shown.map((column) => column.id)))
    } catch (error) {
      editing.onError?.(normalizeTableError(error, 'Unable to create row'))
    } finally { editBusy = false }
  }

  async function deleteRow(id: string) {
    if (!editing?.adapter.delete || editBusy) return
    editBusy = true
    try { await deleteTableRow(editing.adapter.delete, id); editing.onDelete?.(id) }
    catch (error) { editing.onError?.(normalizeTableError(error, 'Unable to delete row')) }
    finally { editBusy = false }
  }

  async function beginEdit(row: TRow, column: TableColumn<TRow>) {
    activeEdit = { rowId: idOf(row), columnId: column.id, draft: String(getCellValue(row, column) ?? ''), pending: false }
    await tick()
    viewport?.querySelector<HTMLInputElement>('[data-edit-input]')?.focus()
  }

  async function finishEdit(row: TRow, column: TableColumn<TRow>, cancel = false) {
    const current = activeEdit
    if (!current || current.pending || current.rowId !== idOf(row) || current.columnId !== column.id) return
    if (cancel || !editing?.adapter.update) { activeEdit = null; return }
    activeEdit = { ...current, pending: true }
    try {
      const outcome = await updateTableCell(editing.adapter.update, current.rowId, row, column, current.draft)
      if (outcome.changed) editing.onCommit?.(outcome.commit)
    } catch (error) {
      editing.onError?.(normalizeTableError(error, 'Unable to update row'))
    } finally { activeEdit = null }
  }

  function canEdit(row: TRow, column: TableColumn<TRow>) {
    return Boolean(editing?.adapter.update &&
      (typeof column.editable === 'function' ? column.editable(row) : column.editable))
  }
</script>

<div bind:this={viewport} data-table="" data-density={density} data-scrolled={scrolledRight || undefined} data-virtual={virtualActive || undefined} data-workbench-responsive={workbenchResponsive || undefined} class={className} class:virtual={virtualActive} style:max-height={virtualActive ? `${virtualHeight}px` : undefined} onscroll={() => scrolledRight = (viewport?.scrollLeft ?? 0) > 0}>
  {#if editing?.adapter.create}
    <div class="create-row"><button type="button" onclick={createRow} disabled={editBusy}>{editBusy ? 'Creating…' : 'New row'}</button></div>
  {/if}
  {#if selectionModel && onSelectionModelChange && selectionQueryKey && rows.length}
    <div class="query-selection">
      {#if selectionForPage.mode === 'query'}
        <span>All matching rows selected.</span>
        <button type="button" onclick={() => onSelectionModelChange?.({ mode: 'ids', ids: [] })}>Clear selection</button>
      {:else}
        <button type="button" onclick={() => onSelectionModelChange?.(selectMatchingQuery(selectionQueryKey!))}>Select all matching rows</button>
      {/if}
    </div>
  {/if}
  <table aria-label={caption ? undefined : label} aria-rowcount={virtualActive ? rows.length + 1 : undefined}>
    {#if caption}<caption>{caption}</caption>{/if}
    <thead><tr>
      {#if expandable}<th scope="col" class="gutter"><span class="sr-only">Expand row</span></th>{/if}
      {#if selectable}
        <th scope="col" class="select-head gutter">
          <label class="check-hit"><input type="checkbox" checked={allSelected} onchange={(event) => { toggleVisible(); event.currentTarget.checked = allSelected }} aria-label="Select all visible rows" /></label>
        </th>
      {/if}
      {#each shown as column (column.id)}
        {@const activeSort = sort?.column === column.id}
        <th scope="col" data-column={column.id} data-pinned={column.pinned || undefined} aria-sort={column.sortable ? activeSort ? sort?.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined} class:end={column.align ? column.align === 'end' : resolveFieldType(column.type).align === 'end'} class:pinned={column.pinned} style:left={column.pinned ? `${offsets.get(column.id) ?? 0}px` : undefined} style:width={widthFor(column) ? `${widthFor(column)}px` : undefined}>
          {#if column.sortable}
            <button type="button" class="sort" aria-label={activeSort ? `${headerLabel(column)}, sorted ${sort?.direction === 'asc' ? 'ascending' : 'descending'}. Activate to change.` : `Sort by ${headerLabel(column)}`} onclick={() => onSortChange?.(nextSort(sort, column.id))}>
              {#if typeof column.header === 'string'}{column.header}{:else if column.header}{@render column.header()}{:else}{column.id}{/if}
              <span aria-hidden="true">{activeSort ? sort?.direction === 'asc' ? '↑' : '↓' : '↕'}</span>
            </button>
          {:else if typeof column.header === 'string'}{column.header}
          {:else if column.header}{@render column.header()}
          {:else}{column.id}{/if}
          {#if resizing?.columns}
            {@const size = widthFor(column) ?? 120}
            {@const minimum = resizing.minColumnWidth ?? 75}
            <button type="button" class="resize-column" aria-label={`Resize ${headerLabel(column)}, ${Math.round(size)} pixels. Use left and right arrow keys.`} data-column-resize-handle={column.id} onpointerdown={(event) => beginResize(event, 'column', column.id, size, minimum)} onkeydown={(event) => resizeKey(event, 'column', column.id, size, minimum)}></button>
          {/if}
        </th>
      {/each}
    </tr></thead>
    <tbody>
      {#if virtualActive && topPad > 0}<tr aria-hidden="true" class="spacer"><td colspan={columnSpan} style:height={`${topPad}px`}></td></tr>{/if}
      {#each renderIndexes as index (idOf(rows[index]))}
        {@const row = rows[index]}
        {@const id = idOf(row)}
        {@const selected = isRowSelected(selectionForPage, id)}
        {@const isExpanded = expanded?.includes(id) ?? false}
        <tr data-row-id={id} data-selected={selected || undefined} data-active={activeRowId === id || undefined} data-expanded={isExpanded || undefined} aria-rowindex={virtualActive ? index + 2 : undefined} style:height={resolvedRowHeights[id] ? `${resolvedRowHeights[id]}px` : undefined}>
          {#if expandable}
            <td class="gutter"><button type="button" class="expand" aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${rowLabel(row)}`} onclick={() => toggleExpanded(id)}>›</button></td>
          {/if}
          {#if selectable}
            <td class="select-cell gutter"><label class="check-hit"><input type="checkbox" checked={selected} onchange={(event) => { toggleOne(id); event.currentTarget.checked = selected }} aria-label={`Select ${rowLabel(row)}`} /></label></td>
          {/if}
          {#each shown as column, columnIndex (column.id)}
            {@const field = resolveFieldType(column.type)}
            <svelte:element this={column.id === headerColumn ? 'th' : 'td'} scope={column.id === headerColumn ? 'row' : undefined} data-column={column.id} class:pinned={column.pinned} class:end={column.align ? column.align === 'end' : field.align === 'end'} class:mono={field.mono} style:left={column.pinned ? `${offsets.get(column.id) ?? 0}px` : undefined} style:width={widthFor(column) ? `${widthFor(column)}px` : undefined}>
              <span class="cell-content">
                {#if activeEdit?.rowId === id && activeEdit.columnId === column.id}
                  <input data-edit-input="" type="text" aria-label={`Edit ${headerLabel(column)}`} value={activeEdit.draft} disabled={activeEdit.pending} oninput={(event) => { if (activeEdit) activeEdit.draft = event.currentTarget.value }} onblur={() => void finishEdit(row, column)} onkeydown={(event) => { if (event.key === 'Escape') { event.preventDefault(); void finishEdit(row, column, true) } else if (event.key === 'Enter') { event.preventDefault(); void finishEdit(row, column) } }} />
                {:else if canEdit(row, column)}
                  <button type="button" class="editable" ondblclick={() => void beginEdit(row, column)} onkeydown={(event) => { if (event.key === 'Enter') void beginEdit(row, column) }}>
                    {#if column.renderCell}{@render column.renderCell(row, getCellValue(row, column))}{:else}{formatFieldValue(getCellValue(row, column), column.type)}{/if}
                  </button>
                {:else if column.renderCell}{@render column.renderCell(row, getCellValue(row, column))}
                {:else}{formatFieldValue(getCellValue(row, column), column.type)}{/if}
                {#if onActiveRowChange && column.id === headerColumn}
                  <button type="button" class="open-row" aria-label={`Open ${rowLabel(row)}`} onclick={() => onActiveRowChange?.(id)}>Open</button>
                {/if}
                {#if editing?.adapter.delete && columnIndex === shown.length - 1}
                  <button type="button" class="delete-row" onclick={() => void deleteRow(id)} disabled={editBusy}>Delete</button>
                {/if}
              </span>
              {#if resizing?.rows && columnIndex === shown.length - 1}
                {@const size = resolvedRowHeights[id] ?? ROW_HEIGHT[density]}
                {@const minimum = resizing.minRowHeight ?? 32}
                <button type="button" class="resize-row" aria-label={`Resize ${rowLabel(row)}, ${Math.round(size)} pixels. Use up and down arrow keys.`} data-row-resize-handle={id} onpointerdown={(event) => beginResize(event, 'row', id, size, minimum)} onkeydown={(event) => resizeKey(event, 'row', id, size, minimum)}></button>
              {/if}
            </svelte:element>
          {/each}
        </tr>
        {#if expandable && isExpanded}
          <tr data-row-detail={id}><td colspan={columnSpan} class="detail">{@render renderExpanded?.(row)}</td></tr>
        {/if}
      {/each}
      {#if virtualActive && bottomPad > 0}<tr aria-hidden="true" class="spacer"><td colspan={columnSpan} style:height={`${bottomPad}px`}></td></tr>{/if}
    </tbody>
  </table>
  {#if rows.length === 0}<div class="empty">{#if emptyState}{@render emptyState()}{:else}Nothing to show.{/if}</div>{/if}
</div>

<style>
  [data-table] { width: 100%; overflow-x: auto; color: var(--tint-ink); }
  [data-table].virtual { overflow-y: auto; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--tint-font-size-sm); }
  caption { padding: var(--tint-space-2) var(--tint-space-3); color: var(--tint-muted); text-align: left; }
  thead { position: sticky; top: 0; z-index: 4; background: var(--tint-surface); }
  th, td { box-sizing: border-box; border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-3); text-align: left; vertical-align: middle; }
  th { position: relative; color: var(--tint-muted); font-weight: 500; }
  tbody th { color: var(--tint-ink); }
  tr[data-selected] { background: var(--tint-accent-soft); }
  tr[data-active] { box-shadow: inset 3px 0 var(--tint-accent); }
  tbody tr:not(.spacer):hover { background: var(--tint-accent-soft); }
  [data-density='compact'] tbody tr[data-row-id] { height: 1.75rem; }
  [data-density='comfortable'] tbody tr[data-row-id] { height: 2.5rem; }
  [data-density='spacious'] tbody tr[data-row-id] { height: 3.25rem; }
  .gutter { width: 2.75rem; padding: 0 var(--tint-space-2); }
  .select-head, .select-cell { position: sticky; left: 0; z-index: 3; background: var(--tint-panel); }
  .select-head { z-index: 5; background: var(--tint-surface); }
  .check-hit { display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; cursor: pointer; }
  input[type='checkbox'] { accent-color: var(--tint-accent); }
  .pinned { position: sticky; z-index: 2; background: var(--tint-panel); box-shadow: inset -1px 0 var(--tint-border); }
  thead .pinned { z-index: 5; background: var(--tint-surface); }
  .end { text-align: right; }
  .mono { font-family: var(--tint-font-mono, monospace); font-variant-numeric: tabular-nums; }
  .sort, .expand, .open-row, .delete-row, .editable, .create-row button, .query-selection button { border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; }
  .sort { display: inline-flex; align-items: center; gap: var(--tint-space-1); min-height: 2rem; font-weight: inherit; }
  .sort:hover, .expand:hover, .open-row:hover { color: var(--tint-accent); }
  .sort:focus-visible, .expand:focus-visible, .open-row:focus-visible, .delete-row:focus-visible, .editable:focus-visible, .create-row button:focus-visible, .query-selection button:focus-visible, .resize-column:focus-visible, .resize-row:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  .expand { min-width: 1.75rem; min-height: 1.75rem; font-size: 1.25rem; }
  .cell-content { display: flex; align-items: center; gap: var(--tint-space-2); }
  .end .cell-content { justify-content: flex-end; }
  .editable { text-align: inherit; }
  .open-row, .delete-row { margin-left: auto; font-size: var(--tint-font-size-xs); }
  .delete-row { color: var(--tint-danger-ink); }
  [data-edit-input] { min-width: 0; border: 1px solid var(--tint-accent); border-radius: var(--tint-radius-sm); background: var(--tint-panel); color: var(--tint-ink); padding: var(--tint-space-1); font: inherit; }
  .detail { background: var(--tint-surface); }
  .resize-column, .resize-row { position: absolute; z-index: 8; opacity: 0; }
  .resize-column { top: 0; right: -4px; bottom: 0; width: 8px; cursor: col-resize; }
  .resize-row { right: 0; bottom: -4px; left: 0; height: 8px; cursor: row-resize; }
  .resize-column:hover, .resize-column:focus-visible, .resize-row:hover, .resize-row:focus-visible { opacity: 1; background: var(--tint-accent-soft); }
  .spacer td { border: 0; padding: 0; }
  .empty { padding: var(--tint-space-6) var(--tint-space-3); color: var(--tint-muted); text-align: center; }
  .create-row, .query-selection { display: flex; justify-content: flex-end; gap: var(--tint-space-2); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-3); font-size: var(--tint-font-size-xs); }
  .query-selection { color: var(--tint-muted); }
  .create-row button, .query-selection button { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: var(--tint-space-1) var(--tint-space-2); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
