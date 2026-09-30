<script lang="ts" generics="TRow">
  import type { Snippet } from 'svelte'
  import { getCellValue } from '../../../core/table/derive'
  import { toDataSortingState, toTableSort } from '../../../core/table/clientState'
  import type { DataFilterField, DataFilterModel, DataSortingState } from '../../../core/table/filterTypes'
  import { workbenchLayout } from '../../../core/table/layout'
  import { matchingQueryKey } from '../../../core/table/query'
  import type { TableSelectionModel } from '../../../core/table/selection'
  import type { TableRowId } from '../../../core/table/types'
  import { deriveWorkbenchRows, type WorkbenchInspectorTab } from '../../../core/table/workbench'
  import DataTable from './DataTable.svelte'
  import DataFilterControls from './DataFilterControls.svelte'
  import TableColumnsMenu from './TableColumnsMenu.svelte'
  import TablePager from './TablePager.svelte'
  import TableToolbar from './TableToolbar.svelte'
  import type { TableColumn } from './types'

  type View = { id: string; label: string }
  type Props<TRow> = {
    rows: readonly TRow[]
    columns: readonly TableColumn<TRow>[]
    rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)
    fields: readonly DataFilterField[]
    filterModel: DataFilterModel
    onFilterModelChange: (model: DataFilterModel) => void
    sorting: DataSortingState
    onSortingChange: (sorting: DataSortingState) => void
    page: number
    pageSize: number
    onPageChange: (page: number) => void
    selectionModel: TableSelectionModel
    onSelectionModelChange: (selection: TableSelectionModel) => void
    activeRowId: TableRowId | null
    onActiveRowChange: (rowId: TableRowId) => void
    hiddenColumns: readonly string[]
    onHiddenColumnsChange: (hidden: readonly string[]) => void
    columnWidths?: Readonly<Record<string, number>>
    onColumnWidthsChange?: (widths: Readonly<Record<string, number>>) => void
    views?: readonly View[]
    activeViewId?: string
    onViewChange?: (viewId: string) => void
    inspectorWidth: number
    onInspectorWidthChange: (width: number) => void
    inspectorTab: WorkbenchInspectorTab
    onInspectorTabChange: (tab: WorkbenchInspectorTab) => void
    renderDetails?: Snippet<[TRow]>
    renderProposalReview?: Snippet<[TRow]>
    renderEvidence?: Snippet<[TRow]>
    renderHistory?: Snippet<[TRow]>
    virtual?: boolean
    label?: string
    class?: string
  }

  let {
    rows, columns, rowId, fields, filterModel, onFilterModelChange, sorting,
    onSortingChange, page, pageSize, onPageChange, selectionModel, onSelectionModelChange,
    activeRowId, onActiveRowChange, hiddenColumns, onHiddenColumnsChange,
    columnWidths, onColumnWidthsChange,
    views = [], activeViewId, onViewChange, inspectorWidth, onInspectorWidthChange,
    inspectorTab, onInspectorTabChange, renderDetails, renderProposalReview,
    renderEvidence, renderHistory, virtual = true, label = 'Collection', class: className,
  }: Props<TRow> = $props()

  let root = $state<HTMLElement | null>(null)
  let containerWidth = $state(0)
  const panelId = $props.id()
  const idOf = (row: TRow): TableRowId => typeof rowId === 'function' ? rowId(row) : String(row[rowId])
  let layout = $derived(workbenchLayout(containerWidth))
  let result = $derived(deriveWorkbenchRows(rows, columns, { filterModel, sorting, page, pageSize }))
  let activeRow = $derived(rows.find((row) => idOf(row) === activeRowId))
  let activeLabel = $derived(activeRow
    ? String(getCellValue(activeRow, columns[0] ?? { id: 'id' }) ?? idOf(activeRow)) : '')
  let queryKey = $derived(matchingQueryKey({ filters: filterModel }))
  let tabs = $derived([
    { id: 'details' as const, label: 'Details', available: true },
    { id: 'proposal' as const, label: 'Proposal review', available: Boolean(renderProposalReview) },
    { id: 'evidence' as const, label: 'Evidence', available: Boolean(renderEvidence) },
    { id: 'history' as const, label: 'History', available: Boolean(renderHistory) },
  ].filter((tab) => tab.available))

  $effect(() => {
    const node = root
    if (!node) return
    const measure = () => { containerWidth = node.clientWidth }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  })

  function resizeInspector(next: number) {
    onInspectorWidthChange(Math.max(260, Math.min(next, Math.max(260, containerWidth - 400))))
  }

  function resizeKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    resizeInspector(inspectorWidth + (event.key === 'ArrowLeft' ? 1 : -1) * (event.shiftKey ? 32 : 8))
  }

  function resizePointer(event: PointerEvent) {
    event.preventDefault()
    const node = event.currentTarget as HTMLElement
    const start = event.clientX
    const width = inspectorWidth
    node.setPointerCapture?.(event.pointerId)
    const move = (next: PointerEvent) => resizeInspector(width - (next.clientX - start))
    const end = (next: PointerEvent) => {
      move(next)
      node.releasePointerCapture?.(next.pointerId)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', end)
      node.removeEventListener('pointercancel', end)
    }
    node.addEventListener('pointermove', move)
    node.addEventListener('pointerup', end)
    node.addEventListener('pointercancel', end)
  }

  function tabKey(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const current = tabs.findIndex((tab) => tab.id === inspectorTab)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : event.key === 'ArrowRight' ? (current + 1) % tabs.length
      : (current - 1 + tabs.length) % tabs.length
    const tab = tabs[next]
    if (tab) {
      onInspectorTabChange(tab.id)
      const buttons = event.currentTarget instanceof Element
        ? event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]') : []
      buttons[next]?.focus()
    }
  }
</script>

<section bind:this={root} data-collection-workbench="" data-inspector={layout.inspector} data-navigation={layout.navigation} class={className} aria-label={label}>
  {#if views.length}
    <nav class="views" aria-label="Collection views" data-layout={layout.navigation}>
      {#each views as view (view.id)}
        <button type="button" aria-current={activeViewId === view.id ? 'page' : undefined} onclick={() => onViewChange?.(view.id)}>{view.label}</button>
      {/each}
    </nav>
  {/if}
  <div class="body" class:docked={layout.inspector === 'right'} style:--inspector-width={`${inspectorWidth}px`}>
    <main class="table-pane">
      <TableToolbar>
        <DataFilterControls {fields} {filterModel} {onFilterModelChange} {sorting} {onSortingChange} />
        <TableColumnsMenu {columns} {hiddenColumns} onChange={onHiddenColumnsChange} />
      </TableToolbar>
      <DataTable rows={result.rows} {columns} {rowId} {label} rowHeaderColumn={columns[0]?.id} sort={toTableSort(sorting)} onSortChange={(sort) => onSortingChange(toDataSortingState(sort))} {selectionModel} {onSelectionModelChange} selectionQueryKey={queryKey} {activeRowId} {onActiveRowChange} {hiddenColumns} {columnWidths} {onColumnWidthsChange} workbenchResponsive {virtual} resizing={{ columns: true }} />
      <TablePager page={result.page} {pageSize} total={result.total} onChange={onPageChange} />
    </main>
    {#if layout.inspector === 'right'}
      <button type="button" class="pane-resize" aria-label={`Inspector width ${inspectorWidth} pixels. Use left and right arrow keys.`} onkeydown={resizeKey} onpointerdown={resizePointer}></button>
    {/if}
    <aside class="inspector" aria-label="Inspector">
      <header><h2>Inspector</h2>{#if activeRow}<p>{activeLabel}</p>{/if}</header>
      {#if activeRow}
        <div role="tablist" tabindex="-1" aria-label="Inspector sections" onkeydown={tabKey}>
          {#each tabs as tab (tab.id)}
            <button type="button" role="tab" aria-selected={inspectorTab === tab.id} aria-controls={panelId} tabindex={inspectorTab === tab.id ? 0 : -1} onclick={() => onInspectorTabChange(tab.id)}>{tab.label}</button>
          {/each}
        </div>
        <div id={panelId} role="tabpanel" tabindex="0" aria-label={tabs.find((tab) => tab.id === inspectorTab)?.label ?? 'Details'}>
          {#if inspectorTab === 'details'}
            {#if renderDetails}{@render renderDetails(activeRow)}{:else}<p>{activeLabel}</p>{/if}
          {:else if inspectorTab === 'proposal' && renderProposalReview}{@render renderProposalReview(activeRow)}
          {:else if inspectorTab === 'evidence' && renderEvidence}{@render renderEvidence(activeRow)}
          {:else if inspectorTab === 'history' && renderHistory}{@render renderHistory(activeRow)}
          {/if}
        </div>
      {:else}<p class="empty-inspector">Select a row to inspect.</p>{/if}
    </aside>
  </div>
</section>

<style>
  [data-collection-workbench] { min-width: 0; color: var(--tint-ink); }
  .views { display: flex; gap: var(--tint-space-1); overflow-x: auto; border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2); }
  .views button, [role='tablist'] button { min-height: 2.25rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-2); color: var(--tint-muted); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); white-space: nowrap; }
  .views button[aria-current], [role='tablist'] button[aria-selected='true'] { background: var(--tint-accent-soft); color: var(--tint-ink); }
  .views[data-layout='chips'] button { border: 1px solid var(--tint-border); border-radius: 999px; }
  button:focus-visible, [role='tabpanel']:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  .body { display: grid; min-width: 0; gap: var(--tint-space-2); }
  .body.docked { grid-template-columns: minmax(0, 1fr) 0.5rem minmax(260px, var(--inspector-width)); }
  .table-pane { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); }
  .pane-resize { min-width: 0.5rem; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-border); cursor: col-resize; }
  .pane-resize:hover { background: var(--tint-accent); }
  .inspector { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); }
  .inspector header { border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-3); }
  h2, p { margin: 0; }
  h2 { font-size: var(--tint-font-size-md); }
  .inspector header p { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  [role='tablist'] { display: flex; gap: var(--tint-space-1); overflow-x: auto; border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2); }
  [role='tabpanel'], .empty-inspector { padding: var(--tint-space-3); font-size: var(--tint-font-size-sm); }
  .empty-inspector { color: var(--tint-muted); }
</style>
