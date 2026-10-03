<script lang="ts">
  import { EventReviewControls } from '../svelte/components/table'
  import DatasetDemo from './svelte/DatasetDemo.svelte'
  import TableDemo from './svelte/TableDemo.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const quickFilters = [
    { id: 'all', label: 'All events' },
    { id: 'review', label: 'Needs review' },
    { id: 'flagged', label: 'Flagged' },
  ]
  const candidatePeople = [
    { id: 'avery', label: 'Avery' },
    { id: 'ravi', label: 'Ravi' },
  ]
  let reviewFilter = $state<string | null>('review')
  let reviewPeople = $state<string[]>([])
  let seekedTo = $state<number | null>(null)

  const fieldTypes = [
    { type: 'text', editor: 'Inline input', value: 'string', note: 'Free text. Truncates to the row height.' },
    { type: 'long-text', editor: 'Auto-height textarea', value: 'string', note: 'Shift+Enter inserts a newline. Tall rows show four lines.' },
    { type: 'number', editor: 'Inline input', value: 'number | null', note: 'Right-aligned, tabular figures. Thousands separators are accepted on paste.' },
    { type: 'select', editor: 'Native select', value: 'string | null', note: 'Commits on choice. Options come from the field definition.' },
    { type: 'multi-select', editor: 'Semicolon list with suggestions', value: 'string[]', note: 'Duplicates collapse. Chips wrap on medium and tall rows.' },
    { type: 'date', editor: 'Inline input', value: "'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD'", note: 'Partial dates are valid, since archives rarely know the day.' },
    { type: 'checkbox', editor: 'Click, Space or Enter', value: 'boolean', note: 'Toggles without entering an edit session.' },
    { type: 'rating', editor: 'Type 1 to 5, 0 clears', value: '1–5 | null', note: 'Commits immediately.' },
    { type: 'url', editor: 'Inline input', value: 'string', note: 'A malformed link is kept and flagged with a warning, not rejected.' },
    { type: 'linked-record', editor: 'Native select', value: 'record id | null', note: 'Shows the target record’s label; stores its id.' },
  ]
  const keys = [
    { keys: 'Click · click again', action: 'The first click selects. Clicking the active cell again edits it (text, number, date, URL) or opens a chip menu (select, multi-select, linked record). Checkbox and rating respond to the first click.' },
    { keys: 'Click a star', action: 'Sets that rating; clicking the current rating clears it.' },
    { keys: 'Right-click · ContextMenu · Shift+F10', action: 'Open the record menu: insert above or below, duplicate, copy, clear, delete. It acts on every selected row, and each action is one undo step.' },
    { keys: 'Tab past the last cell', action: 'Adds a record and starts editing it. The “New record” row at the end of the grid does the same.' },
    { keys: 'Arrows · Tab · Shift+Tab', action: 'Move the active cell. Tab wraps to the next row and leaves the grid from the first or last cell.' },
    { keys: 'Shift+Arrows · Shift+Click · drag', action: 'Extend a range from the active cell.' },
    { keys: 'Ctrl/⌘ + Arrows · Home · End', action: 'Jump to the grid or row edge.' },
    { keys: 'Enter · F2 · double-click', action: 'Edit the active cell. Enter commits and moves down; Tab commits and moves right; Escape cancels.' },
    { keys: 'Type a character', action: 'Replace the cell value and start editing.' },
    { keys: 'Delete · Backspace', action: 'Clear every cell in the range.' },
    { keys: 'Ctrl/⌘ + C · X · V', action: 'Copy, cut and paste as tab-separated text, compatible with Excel, Sheets, Airtable and Notion. One pasted value fills the whole range.' },
    { keys: 'Ctrl/⌘ + D', action: 'Fill the top row of the range downward.' },
    { keys: 'Ctrl/⌘ + Z · Shift+Z · Y', action: 'Undo and redo. A paste or fill is one step.' },
    { keys: 'Shift+Space', action: 'Open the record panel for the active row.' },
  ]

  const api: ApiRow[] = [
    { prop: 'createDatasetStore({ fields, rows, views?, idKey? })', type: 'DatasetStore<TRow>', description: 'Rune-backed rows, schema, saved views and undo/redo. Optional: hosts that persist elsewhere can drive the grid through its callbacks.' },
    { prop: 'DatasetEditor.store / label / height / readOnly', type: 'DatasetStore<TRow> / string / number / boolean', description: 'View bar, grid and record panel wired to one store. The record panel docks beside the grid in wide containers.' },
    { prop: 'DatasetGrid.fields / rows / view', type: 'readonly FieldDef[] / readonly TRow[] / TableView', description: 'Controlled. The grid filters, sorts and groups rows for the view; it never mutates your arrays.' },
    { prop: 'DatasetGrid.onEdit', type: '(ops: DatasetOp<TRow>[], label: string) => void', description: 'Every change arrives as invertible operations (cell, insert-row, remove-row, schema). Apply them with applyDatasetOps or your own backend.' },
    { prop: 'DatasetGrid.onViewChange / onFieldWidth', type: '(view: TableView) => void / (id, width) => void', description: 'Sorting, grouping, filtering and hiding from the field menu report view intent; resizing reports the new width.' },
    { prop: 'DatasetGrid.onOpenRecord / onUndo / onRedo', type: '(rowId) => void / () => void', description: 'Intent hooks for the record panel and for history shortcuts.' },
    { prop: 'DatasetGrid.readOnly / height / idKey / newRowId', type: 'boolean / number / string / () => string', description: 'Disables editing, sets the scroll viewport height, names the identity property and mints ids for new records.' },
    { prop: 'FieldDef', type: '{ id, name, type, options?, readOnly?, width? }', description: 'The first field is the primary field: frozen, never hidden, and used as the record title.' },
    { prop: 'TableView', type: '{ id, name, filters, sorts, groupBy?, hidden, order, rowHeight }', description: 'A saved lens on the same rows. Hidden fields still appear in the record panel.' },
    { prop: 'ViewBar', type: 'views, view, onSelectView, onUpdateView, …', description: 'View tabs with filter, sort, group, field-visibility and row-height controls.' },
    { prop: 'RecordPanel.row / fields / onEdit / onDelete', type: 'TRow / readonly FieldDef[] / callbacks', description: 'Stacked fluid fields for one record, built from the same parsing and validation as grid cells.' },
    { prop: 'parseFieldValue(type, draft)', type: '{ ok: true, value, warning? } | { ok: false, message }', description: 'Typed parsing shared by cells, the record panel and paste. Invalid blocks a commit; a warning does not.' },
    { prop: 'navigateCells · editReducer · planPaste · parseTsv · toTsv', type: 'pure functions', description: 'The cursor, edit-session and clipboard model, usable without any component.' },
    { prop: 'applyView · planRetype · addField · renameField · moveField', type: 'pure functions', description: 'View evaluation and schema commands. planRetype reports how many values would be cleared before a type change.' },
    { prop: 'recordEdit · undoEdit · redoEdit · applyDatasetOps', type: 'pure functions', description: 'History over invertible operations, capped at 200 entries.' },
    { prop: 'DataTable.rows / table', type: 'readonly TRow[] / TableInstance<TRow>', description: 'The read-oriented table: host-derived rows or a vendored v8 table instance.' },
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

  const usage = `import { DatasetEditor, createDatasetStore } from '@nebula/tint/table'
import { createView } from '@nebula/tint/table'

const store = createDatasetStore({
  fields: [
    { id: 'title', name: 'Title', type: 'text' },          // primary field
    { id: 'status', name: 'Status', type: 'select',
      options: [{ value: 'Unread' }, { value: 'Finished' }] },
    { id: 'rating', name: 'Rating', type: 'rating' },
    { id: 'owned', name: 'Owned', type: 'checkbox' },
  ],
  rows: books,                                               // each row has an id
  views: [createView('all', 'All books'),
          createView('top', 'Top rated', {
            filters: [{ id: 'f1', field: 'rating', operator: 'gte', value: 4 }],
            sorts: [{ field: 'rating', desc: true }] })],
})

<DatasetEditor {store} label="Books" height={560} />

// Persisting elsewhere? Skip the store and take operations instead:
<DatasetGrid {fields} {rows} {view} label="Books"
  onEdit={(ops, label) => api.apply(ops)} onViewChange={(v) => view = v} />`
</script>

<DocPage
  title="Dataset Editor"
  description="A typed, spreadsheet-fast grid for editing records: Airtable-style fields and views, Notion-style record pages, Excel-style keyboard and clipboard. Controlled, virtualized, and built on a framework-neutral core."
  importPath="@nebula/tint/table" {usage} {api}
  accessibility="The grid uses role=grid with aria-activedescendant, so focus stays on one element while the active cell moves; typing starts an edit in a real labelled input. Column headers expose aria-sort and open a menu with arrow-key navigation. Invalid cells set aria-invalid and point aria-describedby at their message; the outline is also dotted when unfocused so state never relies on colour alone. Edits, pastes, undo and redo are announced through a polite live region. Resize handles are keyboard operable, rows can be opened as a record from the keyboard, and transitions respect prefers-reduced-motion. The older DataTable keeps native table semantics with checkbox selection, and the workbench inspector uses named tabs and panels."
>
  <DatasetDemo />

  {#snippet extra()}
    <section id="field-types" aria-labelledby="field-types-title">
      <h2 id="field-types-title" tabindex="-1">Field types</h2>
      <p>Every field has a type that decides how a value is shown, edited, parsed, validated and sorted. Blank values always sort last, in both directions, so a sort never buries real data under empty cells.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">Type</th><th scope="col">Editor</th><th scope="col">Stored value</th><th scope="col">Notes</th></tr></thead>
          <tbody>
            {#each fieldTypes as row (row.type)}
              <tr><th scope="row"><code>{row.type}</code></th><td>{row.editor}</td><td><code>{row.value}</code></td><td>{row.note}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <section id="views" aria-labelledby="views-title">
      <h2 id="views-title" tabindex="-1">Views and the record panel</h2>
      <p>A view is a saved lens over the same rows: its own filters, sorts, grouping, hidden and ordered fields, and row height. Switching views never changes data. The first field is the primary field; it stays frozen, cannot be hidden or deleted, and titles the record panel. Open any row to see every field, including those the current view hides, laid out as a stack of fluid fields with the label inside the field and an inset focus or error outline.</p>
      <p>Changing a field’s type first dry-runs the conversion over every row. If any values cannot be read in the new type, you are told how many would be cleared before anything changes, and the whole change, schema and values, is one undo step.</p>
    </section>

    <section id="keyboard" aria-labelledby="keyboard-title">
      <h2 id="keyboard-title" tabindex="-1">Keyboard and clipboard</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">Keys</th><th scope="col">Action</th></tr></thead>
          <tbody>{#each keys as row (row.keys)}<tr><th scope="row">{row.keys}</th><td>{row.action}</td></tr>{/each}</tbody>
        </table>
      </div>
    </section>

    <section id="performance" aria-labelledby="performance-title">
      <h2 id="performance-title" tabindex="-1">Performance</h2>
      <p>Only the rows in and near the viewport are in the DOM, whatever the dataset size; the demo above holds every Open Library record in memory and filters, sorts and groups them on each change. Operations copy only the rows they touch, so editing one cell in a 17,000-row dataset allocates one row, not seventeen thousand.</p>
    </section>

    <section id="related" aria-labelledby="related-title">
      <h2 id="related-title" tabindex="-1">Related: DataTable and Collection Workbench</h2>
      <p>For read-oriented collections with selection, query-wide selection, filtering and an inspector, use <code>DataTable</code> and <code>CollectionWorkbench</code>. They share the same core row pipeline.</p>
      <div class="related"><TableDemo /></div>
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
    </section>
  {/snippet}
</DocPage>

<style>
  .related { margin-top: 1.5rem; padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .event-review-demo { display: grid; gap: .75rem; margin-top: 2rem; }
  h3 { margin: 0; font-size: 1rem; }
  /* DocPage styles are scoped to its own markup, so the tables in the extra sections restate them. */
  section { margin-top: 2.5rem; scroll-margin-top: 6rem; }
  h2 { margin: 0 0 1rem; color: var(--tint-ink); font-size: 1.35rem; letter-spacing: -.025em; }
  p { max-width: 52rem; margin: 0 0 .75rem; color: var(--tint-muted); line-height: 1.65; font-size: .9rem; }
  code { font-size: .8rem; }
  .table-scroll { overflow-x: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: .84rem; }
  th, td { padding: .8rem 1rem; border-bottom: 1px solid var(--tint-border); vertical-align: top; }
  tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
  thead { background: var(--tint-surface); color: var(--tint-muted); }
  tbody th { color: var(--tint-ink); font-weight: 500; }
  td { color: var(--tint-muted); }
</style>
