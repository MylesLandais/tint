<script lang="ts">
  import { EventReviewControls } from '../svelte/components/table'
  import TableDemo from './svelte/TableDemo.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const quickFilters = [
    { id: 'all', label: 'All events' },
    { id: 'review', label: 'Needs review' },
    { id: 'flagged', label: 'Flagged' },
  ]
  const candidatePeople = [
    { id: 'maya', label: 'Maya' },
    { id: 'ravi', label: 'Ravi' },
  ]
  let reviewFilter = $state<string | null>('review')
  let reviewPeople = $state<string[]>([])
  let seekedTo = $state<number | null>(null)

  const api: ApiRow[] = [
    { prop: 'DataTable.rows / table', type: 'readonly TRow[] / TableInstance<TRow>', description: 'Host-derived rows or a vendored v8 table instance.' },
    { prop: 'DataTable.columns', type: 'TableColumn<TRow>[]', description: 'Stable column IDs, accessors, headers, sizing, and field types.' },
    { prop: 'sort / onSortChange', type: 'TableSort | null / callback', description: 'Controlled sort state and intent.' },
    { prop: 'selectionModel', type: "{ mode: 'ids' } | { mode: 'query' }", description: 'Visible or query-wide selection, including rows outside the page.' },
    { prop: 'CollectionWorkbench.filterModel', type: 'DataFilterModel', description: 'Host-owned filter items.' },
    { prop: 'CollectionWorkbench.inspectorTab', type: "'details' | 'proposal' | 'evidence' | 'history'", description: 'Host-owned inspector section.' },
    { prop: 'renderDetails / renderProposalReview / renderEvidence / renderHistory', type: 'Snippet<[TRow]>', description: 'Host-supplied inspector content.' },
    { prop: 'EventReviewControls.quickFilters / selectedQuickFilterId', type: 'EventReviewOption[] / string | null', description: 'Host-owned event filter choices and selected ID.' },
    { prop: 'EventReviewControls.onQuickFilterChange', type: '(id: string) => void', description: 'Reports a filter choice without changing it internally.' },
    { prop: 'EventReviewControls.historyDate / mediaTimestampSeconds / onSeek', type: 'EventReviewHistoryDate | null / number | null / callback', description: 'Semantic event date and media time, with optional seek intent.' },
    { prop: 'EventReviewControls.candidatePeople / selectedCandidatePersonIds / onCandidatePersonIdsChange', type: 'EventReviewOption[] / string[] / callback', description: 'Controlled candidate selection; selection is not an identity or training approval.' },
  ]
  const usage = `import { DataTable, CollectionWorkbench, EventReviewControls } from '@nebula/tint/table'
import { deriveRows } from '@nebula/tint/table'

let sort = $state(null)
let selection = $state([])
let visible = $derived(deriveRows(rows, { columns, sort }))

<DataTable rows={visible} {columns} rowId="id"
  {sort} onSortChange={(next) => sort = next}
  {selection} onSelectionChange={(next) => selection = next.selection} />

<EventReviewControls {quickFilters} selectedQuickFilterId={filterId}
  onQuickFilterChange={(id) => filterId = id}
  {candidatePeople} selectedCandidatePersonIds={candidateIds}
  onCandidatePersonIdsChange={(ids) => candidateIds = ids} />`
</script>

<DocPage title="Table and Workbench" description="Controlled data surfaces with a framework-neutral row pipeline and container-aware workbench layout." importPath="@nebula/tint/table" {usage} {api} accessibility="Tables keep native headers, captions or labels, selection checkboxes, and keyboard-operated sorting and resizing. The inspector uses named tabs and panels. Query-wide selection is announced as a separate action. Event review controls group pressed quick filters and candidate checkboxes in named fieldsets, expose the history date semantically, and label the seek action. Their warning says candidate selection is not identity confirmation or training approval. The available container width chooses the workbench layout.">
  <TableDemo />
  <div class="event-review-demo">
    <h3>Event review controls</h3>
    <EventReviewControls
      {quickFilters} selectedQuickFilterId={reviewFilter} onQuickFilterChange={(id) => reviewFilter = id}
      historyDate={{ dateTime: '2026-09-30', label: 'September 30, 2026' }} mediaTimestampSeconds={93}
      onSeek={(seconds) => seekedTo = seconds}
      {candidatePeople} selectedCandidatePersonIds={reviewPeople} onCandidatePersonIdsChange={(ids) => reviewPeople = ids}
    />
    <p role="status">Filter: {reviewFilter}; candidates: {reviewPeople.length}; {seekedTo === null ? 'No media seek yet' : `Seeked to ${seekedTo}s`}</p>
  </div>
</DocPage>

<style>
  .event-review-demo { display: grid; gap: .75rem; margin-top: 2rem; }
  h3 { margin: 0; font-size: 1rem; }
  p { margin: 0; color: var(--tint-muted); font-size: .85rem; }
</style>
