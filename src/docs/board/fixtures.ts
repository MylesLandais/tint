import type { BoardDocument } from '../../components/board'
import { demoGraphDocument } from '../graph/fixtures/demoDocument'
import { infrasoundArtists } from '../table/infrasound-fixture'

/**
 * Offline board fixture — Now / Next / Later lanes with mixed widget cards.
 * Live graph / table / media mount only in the detail pane.
 */

const nodeCount = demoGraphDocument.nodes.length
const edgeCount = demoGraphDocument.edges.length
const tablePreview = infrasoundArtists.slice(0, 4)

export type BoardGraphPayload = { fixture: 'demo-graph' }
export type BoardTablePayload = { fixture: 'infrasound'; previewIds: readonly string[] }
export type BoardMediaPayload = {
  src: string
  poster: string
  durationLabel: string
}

export const DEMO_BOARD: BoardDocument = {
  schemaVersion: '1',
  id: 'board:demo:planning',
  revision: 'r1',
  metadata: {
    title: 'Planning board',
    purpose: 'Docs workbench — pack graphs, tables, and media as widgets',
  },
  lanes: [
    { id: 'now', label: 'Now' },
    { id: 'next', label: 'Next' },
    { id: 'later', label: 'Later' },
  ],
  cards: [
    {
      id: 'card-graph-intake',
      title: 'Intake → ontology',
      laneId: 'now',
      kind: 'graph',
      preview: {
        kicker: `${nodeCount} nodes · ${edgeCount} edges`,
        metrics: ['readonly', 'demo'],
      },
      payload: { fixture: 'demo-graph' } satisfies BoardGraphPayload,
    },
    {
      id: 'card-table-library',
      title: 'Infrasound library',
      laneId: 'now',
      kind: 'table',
      preview: {
        kicker: `${infrasoundArtists.length} artists · preview ${tablePreview.length}`,
        metrics: tablePreview.map((artist) => artist.name),
      },
      payload: {
        fixture: 'infrasound',
        previewIds: tablePreview.map((artist) => artist.id),
      } satisfies BoardTablePayload,
    },
    {
      id: 'card-media-bbb',
      title: 'Big Buck Bunny',
      laneId: 'next',
      kind: 'media',
      preview: {
        kicker: '10:34 · local demo reel',
        posterUrl: '/images/gallery-1.svg',
        metrics: ['video'],
      },
      payload: {
        src: '/videos/big-buck-bunny.mp4',
        poster: '/images/gallery-1.svg',
        durationLabel: '10:34',
      } satisfies BoardMediaPayload,
    },
    {
      id: 'card-graph-later',
      title: 'Channel topology sketch',
      laneId: 'later',
      kind: 'graph',
      preview: {
        kicker: `${nodeCount} nodes · same demo graph`,
        metrics: ['parked'],
      },
      payload: { fixture: 'demo-graph' } satisfies BoardGraphPayload,
    },
    {
      id: 'card-table-next',
      title: 'Catalog slice',
      laneId: 'next',
      kind: 'table',
      preview: {
        kicker: 'Same library · compact',
        metrics: ['sortable'],
      },
      payload: {
        fixture: 'infrasound',
        previewIds: infrasoundArtists.slice(0, 3).map((artist) => artist.id),
      } satisfies BoardTablePayload,
    },
  ],
}
