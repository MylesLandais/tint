import { useEffect, useState, useSyncExternalStore } from 'react'
import { TileMapViewport, createMockExplorationClient, createPokeforceExplorationClient, type PokeforceMapPack, type TileMapMove } from '../components/tile-map'
import { Surface } from '../components/surface'
import { DocsCallout, DocsDemo, DocsPage, DocsSection } from './components/DocsPage'

const demoCode = `import { useState } from 'react'
import { TileMapViewport, createMockExplorationClient } from '@nebula/tint/tile-map'

const client = createMockExplorationClient()
const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot)

<TileMapViewport
  document={snapshot.document}
  player={snapshot.position}
  onMove={(direction) => void client.move(direction)}
  onInteract={() => void client.interact()}
/>`

const signatureCode = `type TileMapViewportProps = {
  document: TileMapDocument
  player: { x: number; y: number }
  className?: string
  ariaLabel?: string
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onInteract?: () => void
}`

export function TileMapDoc() {
  const [client, setClient] = useState(createMockExplorationClient)
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot)
  const { document, position: player, notice } = snapshot

  useEffect(() => {
    let cancelled = false
    void fetch('/pokeforce/map.json')
      .then((response) => {
        if (!response.ok) throw new Error(`map pack request failed: ${response.status}`)
        return response.json() as Promise<PokeforceMapPack>
      })
      .then((pack) => {
        if (!cancelled) setClient(createPokeforceExplorationClient(pack))
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  function move(direction: TileMapMove) {
    void client.move(direction)
  }

  return (
    <DocsPage
      route="components/tile-map"
      title="Tile map"
      intro="A controlled 2D map surface for rendering Godot-derived chunks and assets in a React host. The demo uses a deterministic local reconstruction while the world service is unavailable."
      note="The viewport owns drawing and input translation. The host owns authoritative position, collision, revisions, and service requests."
      wide
    >
      <DocsSection id="preview" title="PokéForce exploration preview" description="The sample map includes grass, paths, water, the laboratory, collision boundaries, and a player marker.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <TileMapViewport document={document} player={player} onMove={move} onInteract={() => void client.interact()} />
          <Surface className="p-4" tone="subtle">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-tint-muted">Local session</p>
            <p className="mt-3 mb-1 text-sm font-medium text-tint-ink">{document.title}</p>
            <p className="m-0 text-xs text-tint-muted">Position ({player.x}, {player.y})</p>
            <p className="mt-4 mb-0 text-xs text-tint-muted">{notice}</p>
          </Surface>
        </div>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <DocsDemo code={demoCode}>
          <TileMapViewport document={document} player={player} onMove={move} onInteract={() => void client.interact()} />
        </DocsDemo>
      </DocsSection>

      <DocsSection id="boundary" title="Service boundary">
        <DocsCallout variant="note" title="Mock and live clients share the same intent shape">
          Replace the local <code>onMove</code> reducer with an adapter that sends a versioned
          <code>MoveIntent</code> to the world service, then feed the accepted position back into
          <code>player</code>. The renderer never talks to the server directly.
        </DocsCallout>
      </DocsSection>

      <DocsSection id="api" title="API">
        <pre className="overflow-auto rounded-xl border border-tint-border bg-tint-surface p-4 text-xs text-tint-ink"><code>{signatureCode}</code></pre>
      </DocsSection>
    </DocsPage>
  )
}
