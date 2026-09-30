<script lang="ts">
  import CollectionWorkbench from './CollectionWorkbench.svelte'
  import type { TableColumn } from './types'
  import type { TableSelectionModel } from '../../../core/table/selection'

  type Artist = { id: string; name: string; genre: string; bpm: number; state: string }
  const rows: Artist[] = [
    { id: 'a', name: 'Allen Mock', genre: 'House', bpm: 126, state: 'library' },
    { id: 'b', name: 'Centauri', genre: 'Techno', bpm: 132, state: 'wishlist' },
  ]
  const columns: TableColumn<Artist>[] = [
    { id: 'name', header: 'Artist', width: 200 },
    { id: 'genre', header: 'Genre' },
    { id: 'bpm', header: 'BPM', type: 'number' },
    { id: 'state', header: 'State' },
  ]

  let {
    inspectorTab = 'details', onInspectorTabChange = () => {},
    onInspectorWidthChange = () => {}, onSelectionModelChange = () => {},
  }: {
    inspectorTab?: 'details' | 'proposal' | 'evidence' | 'history'
    onInspectorTabChange?: (tab: 'details' | 'proposal' | 'evidence' | 'history') => void
    onInspectorWidthChange?: (width: number) => void
    onSelectionModelChange?: (selection: TableSelectionModel) => void
  } = $props()
</script>

{#snippet details(row: Artist)}<p>Details for {row.name}</p>{/snippet}
{#snippet proposal(row: Artist)}<p>Proposal for {row.name}</p>{/snippet}
{#snippet evidence(row: Artist)}<p>Evidence for {row.name}</p>{/snippet}
{#snippet history(row: Artist)}<p>History for {row.name}</p>{/snippet}
<CollectionWorkbench
  {rows} {columns} rowId="id" fields={[]} filterModel={{ items: [] }} onFilterModelChange={() => {}}
  sorting={[]} onSortingChange={() => {}} page={0} pageSize={25} onPageChange={() => {}}
  selectionModel={{ mode: 'ids', ids: [] }} {onSelectionModelChange}
  activeRowId="a" onActiveRowChange={() => {}}
  hiddenColumns={[]} onHiddenColumnsChange={() => {}}
  views={[{ id: 'all', label: 'All artists' }, { id: 'review', label: 'Review' }]}
  activeViewId="all" onViewChange={() => {}}
  inspectorWidth={320} {onInspectorWidthChange} {inspectorTab} {onInspectorTabChange}
  renderDetails={details} renderProposalReview={proposal} renderEvidence={evidence} renderHistory={history}
/>
