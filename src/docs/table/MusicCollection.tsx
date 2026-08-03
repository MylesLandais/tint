import { ExternalLink, Library as LibraryIcon, ListPlus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  DataTable,
  TableColumnsMenu,
  TablePager,
  TableToolbar,
  deriveFilteredSortedRows,
  deriveRows,
  useTableView,
  type TableColumn,
  type TableSort,
} from '@/components/table'
import {
  COLLECTION_STATE_LABELS,
  CONFIDENCE_LABELS,
  PLATFORM_LABELS,
  formatDuration,
  type MusicCollectionState,
  type MusicLibraryArtist,
  type MusicPlatform,
  type MusicTrack,
} from './music-types'
import { infrasoundArtists } from './infrasound-fixture'
import { artistTracks } from './tracks-fixture'

const PAGE_SIZE = 15

/*
 * The demo owns every piece of state the table reads — sort, selection,
 * expansion, filters, page. That is the point: `DataTable` renders what it is
 * handed and reports intent, so this file is where the domain lives.
 */

function StateBadge({ state }: { state: MusicCollectionState }) {
  return (
    <span
      data-state={state}
      className="inline-flex rounded-full border border-tint-border bg-tint-surface px-2.5 py-0.5 text-xs font-medium text-tint-muted data-[state=library]:border-tint-success/30 data-[state=library]:bg-tint-success-soft data-[state=library]:text-tint-success-ink data-[state=wishlist]:border-tint-warning/30 data-[state=wishlist]:bg-tint-warning-soft data-[state=wishlist]:text-tint-warning-ink"
    >
      {COLLECTION_STATE_LABELS[state]}
    </span>
  )
}

function TrackDetail({ artist }: { artist: MusicLibraryArtist }) {
  const tracks: readonly MusicTrack[] = artistTracks[artist.id] ?? []

  if (!tracks.length) {
    return (
      <p className="m-0 text-sm text-tint-muted">
        No tracks resolved for {artist.name} yet.
      </p>
    )
  }

  // The child grain gets its own table — same component, different columns.
  return (
    <DataTable
      rows={tracks}
      rowId="id"
      density="compact"
      label={`${artist.name} tracks`}
      rowHeaderColumn="title"
      className="rounded-lg border border-tint-border bg-tint-panel"
      columns={TRACK_COLUMNS}
    />
  )
}

const TRACK_COLUMNS: TableColumn<MusicTrack>[] = [
  { id: 'title', header: 'Title' },
  { id: 'bpm', header: 'BPM', type: 'number', width: 72 },
  { id: 'key', header: 'Key', width: 72 },
  { id: 'energy', header: 'Energy', type: 'rating', width: 96 },
  {
    id: 'duration',
    header: 'Time',
    type: 'number',
    width: 80,
    renderCell: (track) => formatDuration(track.duration),
  },
  { id: 'added', header: 'Added', type: 'date', width: 120 },
]

export function MusicCollection() {
  const [artists, setArtists] = useState(infrasoundArtists)
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<MusicCollectionState | 'all'>('all')
  const [sort, setSort] = useState<TableSort | null>({ column: 'name', direction: 'asc' })
  const [selection, setSelection] = useState<readonly string[]>([])
  const [expanded, setExpanded] = useState<readonly string[]>([])
  const [page, setPage] = useState(0)

  const view = useTableView('tint.demo.table.music-collection')

  const columns = useMemo<TableColumn<MusicLibraryArtist>[]>(
    () => [
      {
        id: 'name',
        header: 'Artist',
        pinned: true,
        width: 240,
        hideable: false,
        renderCell: (artist) => (
          <>
            <span className="block font-semibold text-tint-ink">{artist.name}</span>
            <span className="mt-0.5 block text-xs font-normal text-tint-muted">
              {CONFIDENCE_LABELS[artist.confidence]}
            </span>
          </>
        ),
      },
      {
        id: 'platforms',
        header: 'Platforms',
        label: 'Platforms',
        renderCell: (artist) => (
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(artist.platforms) as [MusicPlatform, string][]).map(
              ([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${artist.name} on ${PLATFORM_LABELS[platform]}`}
                  className="inline-flex min-h-7 items-center gap-1 rounded-lg border border-tint-border bg-tint-panel px-2 text-xs font-medium text-tint-muted transition hover:border-tint-accent hover:text-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
                >
                  {PLATFORM_LABELS[platform]}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ),
            )}
          </div>
        ),
      },
      {
        id: 'tracks',
        header: 'Tracks',
        type: 'number',
        sortable: true,
        width: 96,
        accessor: (artist) => artist.catalog.tracks,
      },
      {
        id: 'releases',
        header: 'Releases',
        type: 'number',
        sortable: true,
        width: 104,
        accessor: (artist) => artist.catalog.releases,
      },
      {
        id: 'labels',
        header: 'Labels',
        type: 'number',
        sortable: true,
        width: 96,
        accessor: (artist) => artist.catalog.labels,
      },
      {
        id: 'collectionState',
        header: 'State',
        sortable: true,
        width: 140,
        renderCell: (artist) => <StateBadge state={artist.collectionState} />,
      },
    ],
    [],
  )

  // Make `name` sortable only via the header button — it carries a custom cell,
  // so the sort has to read the underlying value, not the rendered node.
  const sortableColumns = useMemo(
    () => columns.map((c) => (c.id === 'name' ? { ...c, sortable: true } : c)),
    [columns],
  )

  const filters = useMemo(
    () => ({
      name: query || null,
      collectionState: stateFilter === 'all' ? null : stateFilter,
    }),
    [query, stateFilter],
  )

  const total = useMemo(
    () =>
      deriveFilteredSortedRows(artists, { columns: sortableColumns, filters, sort })
        .length,
    [artists, sortableColumns, filters, sort],
  )

  const rows = useMemo(
    () =>
      deriveRows(artists, {
        columns: sortableColumns,
        filters,
        sort,
        page: { index: page, size: PAGE_SIZE },
      }),
    [artists, sortableColumns, filters, sort, page],
  )

  const applyState = (state: MusicCollectionState) => {
    if (!selection.length) return
    const chosen = new Set(selection)
    setArtists((current) =>
      current.map((artist) =>
        chosen.has(artist.id) ? { ...artist, collectionState: state } : artist,
      ),
    )
    setSelection([])
  }

  const resetPage = <T,>(set: (value: T) => void) => (value: T) => {
    set(value)
    setPage(0)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-tint-border bg-tint-panel shadow-[0_16px_48px_var(--tint-shadow-color)]">
      <header className="border-b border-tint-border px-4 py-4 sm:px-6 sm:py-5">
        <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
          Annual crate
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-semibold tracking-tight text-tint-ink sm:text-2xl">
              Infrasound Equinox 2026
            </h2>
            <p className="mt-1 mb-0 text-sm text-tint-muted">
              {artists.length} artists · expand a row for its tracks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-tint-warning-soft px-3 py-1 text-xs font-medium text-tint-warning-ink">
              {artists.filter((a) => a.collectionState === 'wishlist').length} wishlist
            </span>
            <span className="rounded-full bg-tint-success-soft px-3 py-1 text-xs font-medium text-tint-success-ink">
              {artists.filter((a) => a.collectionState === 'library').length} library
            </span>
          </div>
        </div>
      </header>

      <TableToolbar>
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search artists</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tint-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => resetPage(setQuery)(event.target.value)}
            placeholder="Search artists…"
            aria-label="Search artists"
            className="min-h-9 w-full rounded-xl border border-tint-border bg-tint-panel py-1.5 pr-3 pl-9 text-sm text-tint-ink outline-none transition placeholder:text-tint-muted focus:border-tint-accent focus:ring-3 focus:ring-tint-accent-soft"
          />
        </label>

        <label>
          <span className="sr-only">Collection state</span>
          <select
            value={stateFilter}
            onChange={(event) =>
              resetPage(setStateFilter)(
                event.target.value as MusicCollectionState | 'all',
              )
            }
            aria-label="Collection state"
            className="min-h-9 rounded-xl border border-tint-border bg-tint-panel px-3 text-sm text-tint-ink outline-none focus:border-tint-accent focus:ring-3 focus:ring-tint-accent-soft"
          >
            <option value="all">All states</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="wishlist">Wishlist</option>
            <option value="library">Library</option>
          </select>
        </label>

        <TableColumnsMenu
          columns={sortableColumns}
          hiddenColumns={view.hiddenColumns}
          onChange={view.setHiddenColumns}
          className="ml-auto"
        />
      </TableToolbar>

      {selection.length ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-tint-border bg-tint-accent-soft px-4 py-2 sm:px-6">
          <span className="mr-auto text-sm font-medium text-tint-accent">
            {selection.length} selected
          </span>
          <button
            type="button"
            onClick={() => applyState('wishlist')}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-tint-accent/25 bg-tint-panel px-3 text-sm font-medium text-tint-ink transition hover:border-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <ListPlus className="size-4" aria-hidden="true" /> Add to wishlist
          </button>
          <button
            type="button"
            onClick={() => applyState('library')}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-tint-accent px-3 text-sm font-medium text-tint-on-accent transition hover:bg-tint-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <LibraryIcon className="size-4" aria-hidden="true" /> Mark in library
          </button>
        </div>
      ) : null}

      <DataTable
        rows={rows}
        columns={sortableColumns}
        rowId="id"
        label="Infrasound Equinox 2026 artists"
        rowHeaderColumn="name"
        hiddenColumns={view.hiddenColumns}
        sort={sort}
        onSortChange={resetPage(setSort)}
        selection={selection}
        onSelectionChange={(change) => setSelection(change.selection)}
        selectionLabel={(artist) => artist.name}
        expanded={expanded}
        onExpandedChange={setExpanded}
        renderExpanded={(artist) => <TrackDetail artist={artist} />}
        emptyState={
          <p className="m-0 px-6 py-12 text-center text-sm text-tint-muted">
            No artists match this view.
          </p>
        }
      />

      <TablePager page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </section>
  )
}
