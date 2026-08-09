import { DocsNav } from '../components/DocsNav'
import { CodeBlock } from '../components/CodeBlock'
import { PropsTable } from '../components/PropsTable'
import { MusicCollection } from './MusicCollection'
import { MasonryCollection } from './MasonryCollection'

const usageCode = `import {
  DataTable,
  deriveRows,
  type TableColumn,
  type TableSort,
} from 'tint/table'
import { useMemo, useState } from 'react'

const columns: TableColumn<Track>[] = [
  { id: 'title', header: 'Title', sortable: true, pinned: true, width: 240 },
  { id: 'bpm',   header: 'BPM',   sortable: true, type: 'number' },
  { id: 'energy', header: 'Energy', type: 'rating' },
]

export function Tracks({ tracks }: { tracks: Track[] }) {
  const [sort, setSort] = useState<TableSort | null>(null)
  const [selection, setSelection] = useState<readonly string[]>([])

  // The pipeline is a pure function, so the same call runs on a server.
  const rows = useMemo(
    () => deriveRows(tracks, { columns, sort }),
    [tracks, sort],
  )

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowId="id"
      label="Tracks"
      sort={sort}
      onSortChange={setSort}
      selection={selection}
      onSelectionChange={(change) => setSelection(change.selection)}
    />
  )
}`

const dataTableProps = [
  {
    name: 'rows',
    type: 'readonly TRow[]',
    description:
      'Rows to render, already filtered/sorted/paged (see `deriveRows`). Ignored when `table` is supplied.',
  },
  {
    name: 'table',
    type: 'TableInstance<TRow>',
    description:
      'A `useDataTable` instance; supplies rows in place of `rows` — the path where the engine owns the row model, letting a grid and a masonry share one sorted, filtered row set.',
  },
  {
    name: 'columns',
    type: 'readonly TableColumn<TRow>[]',
    required: true,
    description: 'Column definitions — see TableColumn below.',
  },
  {
    name: 'rowId',
    type: '(keyof TRow & string) | ((row: TRow) => string)',
    required: true,
    description: 'How to identify a row — a key name, or a function for composite ids.',
  },
  {
    name: 'label',
    type: 'string',
    description: 'Accessible name for the table.',
  },
  {
    name: 'caption',
    type: 'ReactNode',
    description: 'Visible caption. Prefer this over `label` when the name should be seen.',
  },
  {
    name: 'density',
    type: "'compact' | 'comfortable' | 'spacious'",
    defaultValue: "'comfortable'",
    description: 'Row height scale.',
  },
  {
    name: 'emptyState',
    type: 'ReactNode',
    description: "Shown in place of the body when `rows` is empty (defaults to 'Nothing to show.').",
  },
  {
    name: 'rowHeaderColumn',
    type: 'string',
    description:
      'Column whose value labels the row for assistive tech; renders as `<th scope="row">`. Defaults to the first visible column.',
  },
  {
    name: 'sort',
    type: 'TableSort | null',
    description: 'Current sort. `null` means unsorted.',
  },
  {
    name: 'onSortChange',
    type: '(sort: TableSort | null) => void',
    description: 'Called with the next sort when a sortable header is activated.',
  },
  {
    name: 'selection',
    type: 'readonly string[]',
    description: 'Selected row ids. Omit to disable selection entirely.',
  },
  {
    name: 'onSelectionChange',
    type: '(change: TableSelectionChange) => void',
    description: 'Called with the full next selection plus which row/toggle caused it.',
  },
  {
    name: 'selectionLabel',
    type: '(row: TRow) => string',
    description: "Accessible label for a row's checkbox. Defaults to the row header value.",
  },
  {
    name: 'expanded',
    type: 'readonly string[]',
    description: 'Expanded row ids. Omit to disable expansion entirely.',
  },
  {
    name: 'onExpandedChange',
    type: '(expanded: readonly string[], rowId: string) => void',
    description: 'Called with the full next expanded set and the row that toggled.',
  },
  {
    name: 'renderExpanded',
    type: '(row: TRow) => ReactNode',
    description: 'Body of an expanded row. Returning `null` renders an empty-detail notice.',
  },
  {
    name: 'hiddenColumns',
    type: 'readonly string[]',
    description: 'Column ids hidden from view. The table never hides the last visible column.',
  },
  {
    name: 'onHiddenColumnsChange',
    type: '(hidden: readonly string[]) => void',
    description:
      "Declared on the type, but DataTable itself only reads `hiddenColumns` — pair this with a caller-owned control like TableColumnsMenu, which is what actually invokes it.",
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional classes for the root scroll viewport.',
  },
  {
    name: 'onScroll',
    type: '(event: UIEvent<HTMLDivElement>) => void',
    description: 'Additional scroll handler, called alongside the internal pinned-column-shadow logic.',
  },
  {
    name: 'resizing',
    type: 'TableResizeConfig',
    description: 'Enables column/row drag handles with minimum dimensions.',
  },
  {
    name: 'columnWidths / rowHeights',
    type: 'Readonly<Record<string, number>>',
    description: 'Optional controlled dimensions reported by the resize callbacks.',
  },
  {
    name: 'onResize',
    type: '(event: TableResizeEvent) => void',
    description: 'Reports start, move, and end phases for column or row drags.',
  },
  {
    name: 'editing',
    type: 'TableEditConfig<TRow>',
    description: 'Optional typed create/update/delete adapter for editable columns.',
  },
]

const tableToolbarProps = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'Toolbar content — search, filters, actions. Layout only, no owned behavior.',
  },
]

const tableColumnsMenuProps = [
  {
    name: 'columns',
    type: 'readonly TableColumn<TRow>[]',
    required: true,
    description: 'The full column set (not just visible ones).',
  },
  {
    name: 'hiddenColumns',
    type: 'readonly string[]',
    required: true,
    description:
      'Currently hidden column ids. Named to match `DataTable` — `hiddenColumns` rather than `hidden`, which would collide with the DOM attribute.',
  },
  {
    name: 'onChange',
    type: '(hidden: readonly string[]) => void',
    required: true,
    description:
      'Called with the next hidden-id set when a column is toggled. Refuses to hide the last visible column.',
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Columns'",
    description: 'Accessible name for the menu button and menu.',
  },
]

const tablePagerProps = [
  {
    name: 'page',
    type: 'number',
    required: true,
    description: 'Zero-based current page index.',
  },
  {
    name: 'pageSize',
    type: 'number',
    required: true,
    description: 'Rows per page.',
  },
  {
    name: 'total',
    type: 'number',
    required: true,
    description: 'Row count after filtering, before pagination — what `deriveFilteredSortedRows` produces.',
  },
  {
    name: 'onChange',
    type: '(page: number) => void',
    required: true,
    description: 'Called with the next zero-based page index.',
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Pagination'",
    description: 'Accessible name for the nav landmark.',
  },
]

const tableColumnProps = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: 'Stable id. Also the default key read off the row.',
  },
  {
    name: 'header',
    type: 'ReactNode',
    description: 'Header content. Falls back to the id when absent.',
  },
  {
    name: 'accessor',
    type: '(row: TRow) => unknown',
    description: 'Override how the value is read. Defaults to `row[id]`.',
  },
  {
    name: 'type',
    type: 'TableFieldType',
    defaultValue: "'text'",
    description: 'Selects formatting and alignment — see Table utilities below.',
  },
  {
    name: 'renderCell',
    type: '(row: TRow) => ReactNode',
    description: 'Full control over the cell body. Wins over `type`.',
  },
  {
    name: 'sortable',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Show a sort control in the header.',
  },
  {
    name: 'hideable',
    type: 'boolean',
    defaultValue: 'true',
    description: '`false` keeps the column out of the columns menu — it cannot be hidden.',
  },
  {
    name: 'pinned',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Pin to the left edge during horizontal scroll.',
  },
  {
    name: 'width',
    type: 'number',
    description: 'Width in pixels. Required for pinned columns so offsets can be summed.',
  },
  {
    name: 'align',
    type: "'start' | 'end'",
    description: 'Overrides the alignment the field type would choose.',
  },
  {
    name: 'label',
    type: 'string',
    description: 'Accessible name for the sort control when `header` is not a plain string.',
  },
  {
    name: 'editable',
    type: 'boolean | ((row: TRow) => boolean)',
    description: 'Allows a cell to enter the inline editor on double-click or Enter.',
  },
]

const rowPipelineCode = `// Row pipeline (src/components/table/derive.ts)

// Read a column's value off a row, honoring an \`accessor\` override.
getCellValue<TRow>(row: TRow | undefined, column: Pick<TableColumn<TRow>, 'id' | 'accessor'>): unknown

// Total order used by every sort. Nulls sort last ascending / first descending
// (PostgreSQL's NULLS LAST / NULLS FIRST convention); numbers compare
// numerically, everything else via natural collation.
compareValues(a: unknown, b: unknown): number

// Resolve one filter — a predicate, a { min, max } range, or a substring —
// against one value. null/undefined/'' filters always pass.
matchesFilter(value: unknown, filter: TableFilter): boolean

// Run rows through filter → sort → paginate, in that fixed rank order
// regardless of where a custom stage sits in the stages array.
deriveRows<TRow>(rows: readonly TRow[], input: DeriveInput<TRow>): readonly TRow[]

// The same pipeline with pagination forced off — the denominator for
// a "1–40 of 673" pager total.
deriveFilteredSortedRows<TRow>(rows: readonly TRow[], input: DeriveInput<TRow>): readonly TRow[]

// Advance the tri-state sort cycle: unsorted → ascending → descending → unsorted.
nextSort(current: TableSort | null | undefined, columnId: string): TableSort | null

// Columns in order, minus hidden ids.
visibleColumns<TRow>(columns: readonly TableColumn<TRow>[], hidden?: Iterable<string>): readonly TableColumn<TRow>[]`

const fieldTypesCode = `// Field types (src/components/table/fieldTypes.ts)

// The registry itself.
TABLE_FIELD_TYPES: Record<TableFieldType, TableFieldDefinition>

// Looks up a definition; unknown/absent type ids fall back to 'text'.
resolveFieldType(type?: TableFieldType): TableFieldDefinition

// Shorthand for resolveFieldType(type).format(value).
formatFieldValue(value: unknown, type?: TableFieldType): ReactNode

// True for 'linked-record' and 'computed' — declared but not implemented;
// they render an em dash rather than pretending to resolve a relation or run a formula.
isReservedFieldType(type?: TableFieldType): boolean

// All registered type ids.
listFieldTypes(): TableFieldType[]`

const useTableViewCode = `// View persistence (src/components/table/useTableView.ts)

// A reader's personal view — hidden and pinned columns — persisted to
// localStorage under viewKey. Pass viewKey: undefined to degrade to ordinary
// component state, which is what you want in tests and previews.
useTableView(viewKey: string | undefined, initial?: Partial<TableViewState>): {
  hiddenColumns: readonly string[]
  pinnedColumns: readonly string[]
  setHiddenColumns: (hidden: readonly string[]) => void
  setPinnedColumns: (pinned: readonly string[]) => void
  reset: () => void
}`

const notes = [
  [
    'Data in, intent out',
    'Sort, selection, expansion, and column visibility are props. The table renders what it is handed and reports what the reader did — which is what lets the same component drive a server-sorted, URL-synced view.',
  ],
  [
    'One pipeline, two runtimes',
    '`deriveRows` is a pure function outside React: filter, then sort, then paginate, in that fixed order. Null ordering matches PostgreSQL defaults, so a server `ORDER BY` and the client agree on the same page of rows.',
  ],
  [
    'Types before render props',
    'A column `type` picks formatting and alignment for the ordinary cases; `renderCell` takes over when a cell needs real markup. The same split as `renderPart` in the chat components.',
  ],
]

export function TableDoc() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <DocsNav current="components/table" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            DataTable
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            A controlled data grid with a pure behavior core. The demo below points it at a
            festival lineup: artists are the parent grain with catalog rollups and personal
            collection state, and expanding a row reveals its tracks. Sort, select, hide a
            column, page — every one of those is state this page owns.
          </p>
        </section>

        <MusicCollection />

        <section className="mt-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            One row model, two layouts
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            A masonry is a table whose cells have inconsistent dimensions, and infinite scroll is
            pagination wearing a different hat. Both views below read the same{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">useDataTable</code>{' '}
            instance — flipping the layout changes where cells are placed, not what the filter
            matched or how it sorted. Scrolling to the end grows the page size; that is all
            &ldquo;infinite&rdquo; ever means, and the active filter bounds it.
          </p>
          <MasonryCollection />
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {notes.map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-tint-border bg-tint-panel p-5"
            >
              <h2 className="m-0 text-base font-semibold text-tint-ink">{title}</h2>
              <p className="mt-2 mb-0 text-sm leading-6 text-tint-muted">{body}</p>
            </article>
          ))}
        </section>

        <section id="usage" className="mt-10 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">
            Usage
          </h2>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="mt-14 scroll-mt-24 space-y-10">
          <div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Required props are marked with an asterisk. <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">DataTable</code> is
              generic over the row shape, same as the{' '}
              <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">columns: TableColumn&lt;Track&gt;[]</code> example
              above.
            </p>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">DataTable</h3>
            <PropsTable rows={dataTableProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">TableToolbar</h3>
            <PropsTable rows={tableToolbarProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">TableColumnsMenu</h3>
            <PropsTable rows={tableColumnsMenuProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">TablePager</h3>
            <PropsTable rows={tablePagerProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">
              TableColumn&lt;TRow&gt;
            </h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              Every subcomponent above reads its <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">columns</code> in
              this shape.
            </p>
            <PropsTable rows={tableColumnProps} />
          </div>
        </section>

        <section className="mt-14 max-w-3xl">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Table utilities
          </h2>
          <p className="mt-0 mb-5 text-base leading-7 text-tint-muted">
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">DataTable</code> is the
            component; these are the pure functions underneath it —{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">deriveRows</code> is
            what the table calls internally, exported so a server or a URL-synced view can run
            the identical pipeline.
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-semibold">Row pipeline</h3>
              <CodeBlock code={rowPipelineCode} language="ts" />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">Field types</h3>
              <CodeBlock code={fieldTypesCode} language="ts" />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">View persistence</h3>
              <CodeBlock code={useTableViewCode} language="ts" />
            </div>
          </div>
        </section>

        <p className="mt-8 text-xs text-tint-muted">
          Artist records are real festival lineup data. Track rows are synthetic — generated
          deterministically so the demo has something to sort and expand, and naming nothing
          that exists.
        </p>
      </div>
    </main>
  )
}
