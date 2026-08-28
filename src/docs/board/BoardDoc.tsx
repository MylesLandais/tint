import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyBoardCommand,
  BoardDetail,
  BoardLayout,
  BoardLayoutToggle,
  cardsForLane,
  type BoardCardModel,
  type BoardDocument,
  type BoardLayoutVariant,
} from '../../components/board'
import { Button } from '../../components/button'
import { SplitPane } from '../../components/feed'
import { InteractiveGraphView } from '../../components/graph'
import '../../components/graph/graph.css'
import { MediaPlayer } from '../../components/media-player'
import {
  DataTable,
  useDataTable,
  type MasonryDensity,
  type TableColumn,
} from '../../components/table'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import { demoGraphDocument } from '../graph/fixtures/demoDocument'
import { infrasoundArtists } from '../table/infrasound-fixture'
import type { MusicLibraryArtist } from '../table/music-types'
import {
  DEMO_BOARD,
  type BoardGraphPayload,
  type BoardMediaPayload,
  type BoardTablePayload,
} from './fixtures'

const usage = `import {
  BoardLayout,
  BoardLayoutToggle,
  BoardDetail,
  applyBoardCommand,
  cardsForLane,
} from 'tint/board'
import { SplitPane } from 'tint/feed'

// Host owns the document. Switching Masonry / Kanban changes placement only.
function Workbench({ document, onDocumentChange }) {
  const [variant, setVariant] = useState('masonry')
  const [selectedId, setSelectedId] = useState(document.cards[0]?.id ?? null)
  const selected = document.cards.find((card) => card.id === selectedId) ?? null

  return (
    <SplitPane
      startWidth="1fr"
      middleWidth="24rem"
      start={
        <>
          <BoardLayoutToggle value={variant} onChange={setVariant} />
          <BoardLayout
            cards={document.cards}
            lanes={document.lanes}
            variant={variant}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </>
      }
      middle={
        <BoardDetail card={selected}>
          {/* Host mounts InteractiveGraphView / DataTable / MediaPlayer here */}
        </BoardDetail>
      }
    />
  )
}`

const artistColumns: TableColumn<MusicLibraryArtist>[] = [
  { id: 'name', header: 'Artist', sortable: true, pinned: true, width: 200 },
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
  { id: 'collectionState', header: 'State', sortable: true, width: 130 },
]

function isGraphPayload(payload: unknown): payload is BoardGraphPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'fixture' in payload &&
    (payload as BoardGraphPayload).fixture === 'demo-graph'
  )
}

function isTablePayload(payload: unknown): payload is BoardTablePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'fixture' in payload &&
    (payload as BoardTablePayload).fixture === 'infrasound'
  )
}

function isMediaPayload(payload: unknown): payload is BoardMediaPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'src' in payload &&
    typeof (payload as BoardMediaPayload).src === 'string'
  )
}

function TableDetail({ rows }: { rows: readonly MusicLibraryArtist[] }) {
  const table = useDataTable({
    data: rows,
    columns: artistColumns,
    rowId: 'id',
  })
  return (
    <div className="p-2">
      <DataTable table={table} columns={artistColumns} rowId="id" label="Artists" density="compact" />
    </div>
  )
}

function CardDetailBody({ card }: { card: BoardCardModel }) {
  if (card.kind === 'graph' && isGraphPayload(card.payload)) {
    return (
      <div className="h-[22rem]">
        <InteractiveGraphView
          document={demoGraphDocument}
          readonly
          showInspector={false}
        />
      </div>
    )
  }

  if (card.kind === 'table' && isTablePayload(card.payload)) {
    return <TableDetail rows={infrasoundArtists.slice(0, 24)} />
  }

  if (card.kind === 'media' && isMediaPayload(card.payload)) {
    return (
      <div className="p-3">
        <MediaPlayer
          kind="video"
          src={card.payload.src}
          poster={card.payload.poster}
          label={card.title}
          title={card.title}
        />
      </div>
    )
  }

  return (
    <p className="m-0 p-4 text-sm text-tint-muted">
      No live surface for this card&apos;s payload.
    </p>
  )
}

function MoveControl({
  card,
  document,
  onDocumentChange,
}: {
  card: BoardCardModel
  document: BoardDocument
  onDocumentChange: (next: BoardDocument) => void
}) {
  return (
    <label className="inline-flex items-center gap-1 text-[0.6875rem] text-tint-muted">
      <span className="sr-only">Move {card.title} to lane</span>
      <select
        className="max-w-[6.5rem] rounded-md border border-tint-border bg-tint-panel px-1.5 py-0.5 text-[0.6875rem] text-tint-ink"
        value={card.laneId}
        onChange={(event) => {
          const laneId = event.target.value
          if (laneId === card.laneId) return
          onDocumentChange(
            applyBoardCommand(document, {
              type: 'card.move',
              cardId: card.id,
              laneId,
              index: cardsForLane(document, laneId).length,
            }),
          )
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {document.lanes.map((lane) => (
          <option key={lane.id} value={lane.id}>
            {lane.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Workbench() {
  const [document, setDocument] = useState<BoardDocument>(DEMO_BOARD)
  const [variant, setVariant] = useState<BoardLayoutVariant>('masonry')
  const [density, setDensity] = useState<MasonryDensity>('auto')
  const [selectedId, setSelectedId] = useState<string | null>(
    DEMO_BOARD.cards[0]?.id ?? null,
  )
  const [boardWidth, setBoardWidth] = useState('1fr')
  const [detailWidth, setDetailWidth] = useState('26rem')

  const selected =
    document.cards.find((card) => card.id === selectedId) ?? null

  const visibleIds = useMemo(() => {
    if (variant === 'kanban') {
      return document.lanes.flatMap((lane) =>
        cardsForLane(document, lane.id).map((card) => card.id),
      )
    }
    return document.cards.map((card) => card.id)
  }, [document, variant])

  useEffect(() => {
    if (selectedId && !document.cards.some((card) => card.id === selectedId)) {
      setSelectedId(document.cards[0]?.id ?? null)
    }
  }, [document.cards, selectedId])

  const moveSelection = useCallback(
    (delta: number) => {
      if (visibleIds.length === 0) return
      const current = selectedId ? visibleIds.indexOf(selectedId) : -1
      const nextIndex =
        current < 0
          ? 0
          : (current + delta + visibleIds.length) % visibleIds.length
      setSelectedId(visibleIds[nextIndex] ?? null)
    },
    [selectedId, visibleIds],
  )

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('select, input, textarea, button, [contenteditable]')) return

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(1)
      } else if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(-1)
      } else if (event.key === 'ArrowRight' && variant === 'kanban') {
        event.preventDefault()
        moveSelection(1)
      } else if (event.key === 'ArrowLeft' && variant === 'kanban') {
        event.preventDefault()
        moveSelection(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveSelection, variant])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <BoardLayoutToggle value={variant} onChange={setVariant} />
        {variant === 'masonry' ? (
          <label className="inline-flex items-center gap-2 text-xs text-tint-muted">
            Density
            <select
              className="rounded-md border border-tint-border bg-tint-panel px-2 py-1 text-xs text-tint-ink"
              value={density}
              onChange={(event) =>
                setDensity(
                  event.target.value === 'auto'
                    ? 'auto'
                    : (Number(event.target.value) as MasonryDensity),
                )
              }
            >
              <option value="auto">Auto</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>
        ) : null}
        <p className="m-0 text-xs text-tint-muted">
          {selected ? (
            <>
              Selected <span className="font-medium text-tint-ink">{selected.title}</span>
            </>
          ) : (
            'Nothing selected'
          )}
          {' · '}
          <span className="font-mono tabular-nums">{document.revision}</span>
          {' · j/k or arrows move selection'}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setDocument(DEMO_BOARD)
            setSelectedId(DEMO_BOARD.cards[0]?.id ?? null)
          }}
        >
          Reset
        </Button>
      </div>

      <div className="h-[34rem] overflow-hidden rounded-xl border border-tint-border">
        <SplitPane
          className="h-full"
          startWidth={boardWidth}
          middleWidth={detailWidth}
          onStartWidthChange={(px) => setBoardWidth(`${px}px`)}
          onMiddleWidthChange={(px) => setDetailWidth(`${px}px`)}
          start={
            <div className="h-full overflow-auto p-3">
              <BoardLayout
                cards={document.cards}
                lanes={document.lanes}
                variant={variant}
                density={density}
                selectedId={selectedId}
                onSelect={setSelectedId}
                label="Planning board"
                renderActions={(card) => (
                  <MoveControl
                    card={card}
                    document={document}
                    onDocumentChange={setDocument}
                  />
                )}
              />
            </div>
          }
          middle={
            <div className="h-full overflow-auto p-3">
              <BoardDetail card={selected} className="h-full min-h-[20rem]">
                {selected ? <CardDetailBody card={selected} /> : null}
              </BoardDetail>
            </div>
          }
        />
      </div>
    </div>
  )
}

export function BoardDoc() {
  return (
    <DocsPage
      route="components/board"
      title="Board"
      wide
      intro="A flat board of rich-media widget cards — graphs, tables, and media — packed with DataMasonry or grouped into kanban lanes. Cards show previews; the selected card’s live surface opens in a detail pane."
      note="Board chrome never imports InteractiveGraphView, DataTable, or MediaPlayer. Hosts (and this docs page) supply those in the detail renderer so the board barrel stays light."
    >
      <DocsSection id="preview" title="Workbench">
        <DocsPreview className="p-3 sm:p-4">
          <Workbench />
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable
          rows={[
            {
              name: 'cards',
              type: 'readonly BoardCardModel[]',
              required: true,
              description: 'Host-owned widget cards for BoardLayout.',
            },
            {
              name: 'lanes',
              type: 'readonly BoardLane[]',
              required: true,
              description: 'Lane definitions. Kanban renders one column per lane; masonry ignores them for packing.',
            },
            {
              name: 'variant',
              type: "BoardLayoutVariant ('masonry' | 'kanban')",
              description: 'Placement mode. Defaults to masonry (DataMasonry pack).',
            },
            {
              name: 'selectedId',
              type: 'string | null',
              description: 'Highlighted card id.',
            },
            {
              name: 'onSelect',
              type: '(cardId: string) => void',
              description: 'Card selection intent.',
            },
            {
              name: 'renderActions',
              type: '(card: BoardCardModel) => ReactNode',
              description: 'Optional per-card trailing actions (e.g. Move to…).',
            },
            {
              name: 'renderPreview',
              type: '(card: BoardCardModel) => ReactNode',
              description: 'Optional body below the card chrome.',
            },
            {
              name: 'empty',
              type: 'ReactNode',
              description: 'Empty-board copy.',
            },
            {
              name: 'density',
              type: 'MasonryDensity',
              description: 'DataMasonry density passthrough when variant is masonry.',
            },
            {
              name: 'targetWidth',
              type: 'number',
              description: 'Ideal column width for auto density.',
            },
            {
              name: 'gap',
              type: 'number',
              description: 'Gap between masonry cells, in pixels.',
            },
            {
              name: 'label',
              type: 'string',
              description: 'Accessible name for the masonry list.',
            },
            {
              name: 'card',
              type: 'BoardCardModel',
              required: true,
              description: 'BoardCard chrome model (kind, title, preview).',
            },
            {
              name: 'selected',
              type: 'boolean',
              description: 'Selected ring on BoardCard.',
            },
            {
              name: 'onSelect',
              type: '(cardId: string) => void',
              description: 'BoardCard click / keyboard activation.',
            },
            {
              name: 'actions',
              type: 'ReactNode',
              description: 'Trailing actions on BoardCard (clicks do not select).',
            },
            {
              name: 'children',
              type: 'ReactNode',
              description: 'BoardCard preview body, or BoardDetail live surface.',
            },
            {
              name: 'empty',
              type: 'ReactNode',
              description: 'BoardDetail empty-state copy when card is null.',
            },
            {
              name: 'value',
              type: 'BoardLayoutVariant',
              required: true,
              description: 'BoardLayoutToggle current variant.',
            },
            {
              name: 'onChange',
              type: '(variant: BoardLayoutVariant) => void',
              required: true,
              description: 'BoardLayoutToggle change intent.',
            },
            {
              name: 'disabled',
              type: 'boolean',
              description: 'Disables the layout toggle.',
            },
            {
              name: 'className',
              type: 'string',
              description: 'Optional class on BoardLayoutToggle.',
            },
          ]}
        />
      </DocsSection>
    </DocsPage>
  )
}
