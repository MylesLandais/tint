<script lang="ts">
  import { deriveRows } from '../../core/table/derive'
  import type { DataFilterField, DataFilterModel, DataSortingState } from '../../core/table/filterTypes'
  import type { TableSelectionModel } from '../../core/table/selection'
  import type { TableSort } from '../../core/table/types'
  import type { WorkbenchInspectorTab } from '../../core/table/workbench'
  import { CollectionWorkbench, DataTable, type TableColumn } from '../../svelte/components/table'

  type Track = { id: string; title: string; genre: string; bpm: number; state: string }
  const tracks: Track[] = [
    { id: 'a', title: 'Night Drive', genre: 'Electronic', bpm: 124, state: 'Ready' },
    { id: 'b', title: 'Low Tide', genre: 'Ambient', bpm: 90, state: 'Review' },
    { id: 'c', title: 'Blue Hour', genre: 'Jazz', bpm: 112, state: 'Ready' },
    { id: 'd', title: 'Signal Path', genre: 'Electronic', bpm: 130, state: 'Ready' },
    { id: 'e', title: 'Quiet Orbit', genre: 'Ambient', bpm: 82, state: 'Draft' },
  ]
  const columns: TableColumn<Track>[] = [
    { id: 'title', header: 'Track', sortable: true, width: 220, hideable: false },
    { id: 'genre', header: 'Genre', sortable: true, width: 150 },
    { id: 'bpm', header: 'BPM', type: 'number', sortable: true, width: 90 },
    { id: 'state', header: 'State', sortable: true, width: 100 },
  ]
  const fields: DataFilterField[] = [
    { id: 'title', label: 'Track', type: 'text', sortable: true },
    { id: 'genre', label: 'Genre', type: 'select', options: [
      { value: 'Ambient', label: 'Ambient' }, { value: 'Electronic', label: 'Electronic' }, { value: 'Jazz', label: 'Jazz' },
    ], sortable: true },
    { id: 'bpm', label: 'BPM', type: 'number', sortable: true },
  ]
  let sort = $state<TableSort | null>(null)
  let selected = $state<string[]>([])
  let sorted = $derived(deriveRows(tracks, { columns, sort }))
  let filterModel = $state<DataFilterModel>({ items: [] })
  let sorting = $state<DataSortingState>([])
  let page = $state(0)
  let selectionModel = $state<TableSelectionModel>({ mode: 'ids', ids: [] })
  let activeRowId = $state<string | null>('a')
  let hiddenColumns = $state<string[]>([])
  let inspectorWidth = $state(320)
  let inspectorTab = $state<WorkbenchInspectorTab>('details')
  let activeViewId = $state('all')
</script>

<div class="table-demo">
  <section aria-labelledby="table-demo-title">
    <h3 id="table-demo-title">DataTable</h3>
    <p>Sorting and selection report intent to this page, which owns the state.</p>
    <DataTable rows={sorted} {columns} rowId="id" label="Demo tracks" rowHeaderColumn="title" {sort} onSortChange={(next) => sort = next} selection={selected} onSelectionChange={(change) => selected = [...change.selection]} selectionLabel={(row) => row.title} />
    <p aria-live="polite">Selected IDs: {selected.join(', ') || 'none'}</p>
  </section>

  <section aria-labelledby="workbench-demo-title">
    <h3 id="workbench-demo-title">Collection Workbench</h3>
    <p>The available container width controls table columns, navigation, and inspector placement.</p>
    <CollectionWorkbench
      rows={tracks} {columns} rowId="id" {fields} {filterModel}
      onFilterModelChange={(next) => { filterModel = next; page = 0 }}
      {sorting} onSortingChange={(next) => sorting = next}
      {page} pageSize={4} onPageChange={(next) => page = next}
      {selectionModel} onSelectionModelChange={(next) => selectionModel = next}
      {activeRowId} onActiveRowChange={(next) => activeRowId = next}
      {hiddenColumns} onHiddenColumnsChange={(next) => hiddenColumns = [...next]}
      views={[{ id: 'all', label: 'All tracks' }, { id: 'review', label: 'Review' }]}
      {activeViewId} onViewChange={(next) => activeViewId = next}
      {inspectorWidth} onInspectorWidthChange={(next) => inspectorWidth = next}
      {inspectorTab} onInspectorTabChange={(next) => inspectorTab = next}
      label="Track collection" virtual={false}
    >
      {#snippet renderDetails(row: Track)}<p>{row.title} · {row.genre} · {row.bpm} BPM</p>{/snippet}
      {#snippet renderProposalReview(row: Track)}<p>Review the proposed metadata for {row.title}.</p>{/snippet}
      {#snippet renderEvidence(row: Track)}<p>Evidence supplied by the host for {row.title}.</p>{/snippet}
      {#snippet renderHistory(row: Track)}<p>Change history for {row.title}.</p>{/snippet}
    </CollectionWorkbench>
  </section>
</div>

<style>
  .table-demo { display: grid; gap: 2rem; min-width: 0; }
  section { min-width: 0; }
  h3 { margin: 0 0 .25rem; color: var(--tint-ink); font-size: 1rem; }
  p { margin: .25rem 0 1rem; color: var(--tint-muted); font-size: .82rem; }
</style>
