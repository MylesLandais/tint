import { LayoutGrid, Rows3, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import {
  DataMasonry,
  DataTable,
  InfiniteRows,
  TableToolbar,
  toColumnFilters,
  useDataTable,
  type DataFilterModel,
  type MasonryDensity,
  type TableColumn,
} from '@/components/table'
import {
  COLLECTION_STATE_LABELS,
  PLATFORM_LABELS,
  type MusicLibraryArtist,
  type MusicPlatform,
} from './music-types'
import { infrasoundArtists } from './infrasound-fixture'
import { artistTracks } from './tracks-fixture'

/*
 * The same row model, rendered two ways.
 *
 * One `useDataTable` instance owns the sort, the filter, and the page. Flipping
 * between grid and masonry changes nothing about the data — only where the cells
 * are placed. Infinite scroll here is literally the page size growing, which is
 * what it always is underneath.
 */

const PAGE_STEP = 12

/** A chip. What a tag looks like when it is the content of a cell. */
function Token({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-tint-border bg-tint-surface px-1.5 py-0.5 text-[0.6875rem] font-medium text-tint-muted">
      {children}
    </span>
  )
}

function ArtistCell({ artist }: { artist: MusicLibraryArtist }) {
  const tracks = artistTracks[artist.id] ?? []
  // Varying content length is the entire reason a masonry exists — the cell is
  // as tall as it needs to be, and the layout packs around that.
  const peak = tracks.slice(0, 3)

  return (
    <article className="mr-3 mb-3 overflow-hidden rounded-xl border border-tint-border bg-tint-panel">
      <div className="flex items-start justify-between gap-2 border-b border-tint-border px-3 py-2.5">
        <h3 className="m-0 text-sm font-semibold text-tint-ink">{artist.name}</h3>
        <span
          data-state={artist.collectionState}
          className="shrink-0 rounded-full border border-tint-border bg-tint-surface px-2 py-0.5 text-[0.6875rem] font-medium text-tint-muted data-[state=library]:border-tint-success/30 data-[state=library]:bg-tint-success-soft data-[state=library]:text-tint-success-ink data-[state=wishlist]:border-tint-warning/30 data-[state=wishlist]:bg-tint-warning-soft data-[state=wishlist]:text-tint-warning-ink"
        >
          {COLLECTION_STATE_LABELS[artist.collectionState]}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <p className="m-0 font-mono text-xs tabular-nums text-tint-muted">
          {artist.catalog.tracks} tracks · {artist.catalog.releases} releases ·{' '}
          {artist.catalog.labels} labels
        </p>

        {peak.length ? (
          <ul className="mt-2 mb-0 list-none space-y-1 p-0">
            {peak.map((track) => (
              <li
                key={track.id}
                className="flex items-baseline justify-between gap-2 text-xs text-tint-ink"
              >
                <span className="truncate">{track.title}</span>
                <span className="shrink-0 font-mono tabular-nums text-tint-muted">
                  {track.bpm} · {track.key}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1">
          {(Object.keys(artist.platforms) as MusicPlatform[]).map((platform) => (
            <Token key={platform}>{PLATFORM_LABELS[platform]}</Token>
          ))}
        </div>
      </div>
    </article>
  )
}

const columns: TableColumn<MusicLibraryArtist>[] = [
  { id: 'name', header: 'Artist', sortable: true, pinned: true, width: 220, hideable: false },
  { id: 'tracks', header: 'Tracks', type: 'number', sortable: true, width: 96,
    accessor: (a) => a.catalog.tracks },
  { id: 'releases', header: 'Releases', type: 'number', sortable: true, width: 104,
    accessor: (a) => a.catalog.releases },
  { id: 'collectionState', header: 'State', sortable: true, width: 130 },
]

export function MasonryCollection() {
  const [layout, setLayout] = useState<'masonry' | 'grid'>('masonry')
  const [density, setDensity] = useState<MasonryDensity>('auto')
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(PAGE_STEP)

  const filterModel = useMemo<DataFilterModel>(
    () => ({
      items: query
        ? [
            {
              id: 'name-contains',
              field: 'name',
              operator: 'contains',
              value: query,
            },
          ]
        : [],
    }),
    [query],
  )

  const table = useDataTable({
    data: infrasoundArtists,
    columns,
    rowId: 'id',
    state: useMemo(
      () => ({
        columnFilters: toColumnFilters(filterModel),
        pagination: { pageIndex: 0, pageSize },
        sorting: [{ id: 'name', desc: false }],
      }),
      [filterModel, pageSize],
    ),
  })

  const total = table.getFilteredRowModel().rows.length
  const shown = table.getRowModel().rows.length
  const hasMore = shown < total

  const search = (value: string) => {
    setQuery(value)
    // A new filter means a new result set — start the window over.
    setPageSize(PAGE_STEP)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-tint-border bg-tint-panel">
      <TableToolbar>
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search artists</span>
          <Icon
            icon={Search}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tint-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="Filter artists…"
            aria-label="Filter artists"
            className="min-h-9 w-full rounded-xl border border-tint-border bg-tint-panel py-1.5 pr-3 pl-9 text-sm text-tint-ink outline-none placeholder:text-tint-muted focus:border-tint-accent focus:ring-3 focus:ring-tint-accent-soft"
          />
        </label>

        <div
          role="radiogroup"
          aria-label="Layout"
          className="inline-flex items-center gap-0.5 rounded-lg border border-tint-border bg-tint-surface p-0.5"
        >
          {([['masonry', 'Masonry', LayoutGrid], ['grid', 'Grid', Rows3]] as const).map(
            ([value, label, layoutIcon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={layout === value}
                onClick={() => setLayout(value)}
                className={
                  layout === value
                    ? 'inline-flex items-center gap-1.5 rounded-md bg-tint-panel px-2 py-1.5 text-xs font-medium text-tint-ink shadow-sm'
                    : 'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:text-tint-ink'
                }
              >
                <Icon icon={layoutIcon} size="sm" />
                {label}
              </button>
            ),
          )}
        </div>

        {layout === 'masonry' ? (
          <label className="inline-flex items-center gap-2 text-xs text-tint-muted">
            Columns
            <select
              value={String(density)}
              onChange={(event) =>
                setDensity(
                  event.target.value === 'auto'
                    ? 'auto'
                    : (Number(event.target.value) as MasonryDensity),
                )
              }
              className="min-h-9 rounded-lg border border-tint-border bg-tint-panel px-2 text-xs text-tint-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              {['auto', '2', '3', '4', '5'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <span className="ml-auto font-mono text-xs tabular-nums text-tint-muted">
          {shown} / {total}
        </span>
      </TableToolbar>

      <div className="p-3">
        {layout === 'masonry' ? (
          <DataMasonry
            table={table}
            rowId="id"
            density={density}
            label="Artists"
            renderItem={(artist) => <ArtistCell artist={artist} />}
            emptyState={
              <p className="m-0 px-6 py-12 text-center text-sm text-tint-muted">
                No artists match this filter.
              </p>
            }
            footer={
              <InfiniteRows
                hasMore={hasMore}
                empty={total === 0}
                onLoadMore={() => setPageSize((size) => size + PAGE_STEP)}
                emptyLabel="Nothing matched."
                endLabel={`All ${total} artists shown`}
              />
            }
          />
        ) : (
          <>
            <DataTable
              table={table}
              columns={columns}
              rowId="id"
              label="Artists"
              rowHeaderColumn="name"
              emptyState={
                <p className="m-0 px-6 py-12 text-center text-sm text-tint-muted">
                  No artists match this filter.
                </p>
              }
            />
            <InfiniteRows
              hasMore={hasMore}
              empty={total === 0}
              onLoadMore={() => setPageSize((size) => size + PAGE_STEP)}
              emptyLabel="Nothing matched."
              endLabel={`All ${total} artists shown`}
            />
          </>
        )}
      </div>
    </section>
  )
}
