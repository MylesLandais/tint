import { ThemeControls } from '../components/ThemeControls'
import { CodeBlock } from '../components/CodeBlock'
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
        <nav
          aria-label="Tint documentation"
          className="mb-8 flex items-center gap-2 text-sm text-tint-muted"
        >
          <a href="#/" className="transition hover:text-tint-accent">
            Tint
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-tint-ink">Table</span>
          <span className="ml-auto">
            <ThemeControls />
          </span>
        </nav>

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

        <p className="mt-8 text-xs text-tint-muted">
          Artist records are real festival lineup data. Track rows are synthetic — generated
          deterministically so the demo has something to sort and expand, and naming nothing
          that exists.
        </p>
      </div>
    </main>
  )
}
