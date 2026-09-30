<script lang="ts">
  import { onMount } from 'svelte'
  import { TileMapViewport, createMockExplorationClient, createPokeforceExplorationClient,
    type ExplorationClient, type ExplorationSnapshot, type PokeforceMapPack,
    type TileMapMove } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let client: ExplorationClient = createMockExplorationClient()
  let snapshot = $state<ExplorationSnapshot>(client.getSnapshot())

  onMount(() => {
    let active = true
    let unsubscribe = client.subscribe(() => snapshot = client.getSnapshot())
    void fetch('/pokeforce/map.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Map pack request failed: ${response.status}`)
        return response.json() as Promise<PokeforceMapPack>
      })
      .then((pack) => {
        if (!active) return
        unsubscribe()
        client = createPokeforceExplorationClient(pack)
        snapshot = client.getSnapshot()
        unsubscribe = client.subscribe(() => snapshot = client.getSnapshot())
      })
      .catch(() => { /* The deterministic mock remains available without the sample pack. */ })
    return () => { active = false; unsubscribe() }
  })

  function move(direction: TileMapMove) { void client.move(direction) }
  const api: ApiRow[] = [
    { prop: 'document / player', type: 'TileMapDocument / { x, y }', description: 'Host-owned map and authoritative player position.' },
    { prop: 'onMove / onInteract', type: 'intent callbacks', description: 'Move and interaction requests; the host applies accepted state.' },
    { prop: 'ariaLabel / onKeyDown / onPointerDown', type: 'string / event callbacks', description: 'Accessible name and optional low-level input hooks.' },
    { prop: 'createMockExplorationClient', type: 'pure TypeScript client', description: 'Deterministic local client with the same move and interact shape as a live adapter.' },
  ]
  const usage = `import { TileMapViewport, createMockExplorationClient } from '@nebula/tint/tile-map'

const client = createMockExplorationClient()
let snapshot = $state(client.getSnapshot())
const unsubscribe = client.subscribe(() => snapshot = client.getSnapshot())

<TileMapViewport document={snapshot.document} player={snapshot.position}
  onMove={(direction) => void client.move(direction)}
  onInteract={() => void client.interact()} />`
</script>

<DocPage title="Tile Map" description="A controlled 2D map surface for Godot-derived chunks and assets. The preview uses a deterministic local reconstruction when the sample pack is unavailable." importPath="@nebula/tint/tile-map" {usage} {api} accessibility="The map is a named, keyboard-focusable button. Arrow keys and WASD request moves, and Enter or E requests interaction. Collision is checked in plain TypeScript before forwarding movement; visible focus uses Tint tokens.">
  <div class="tile-demo">
    <TileMapViewport document={snapshot.document} player={snapshot.position} onMove={move} onInteract={() => void client.interact()} />
    <aside><h3>Local session</h3><p>{snapshot.document.title}</p><p>Position ({snapshot.position.x}, {snapshot.position.y})</p><p role="status">{snapshot.notice}</p></aside>
  </div>
</DocPage>

<style>
  .tile-demo { display: grid; gap: 1rem; min-width: 0; }
  aside { padding: 1rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); }
  h3 { margin: 0 0 .75rem; color: var(--tint-ink); font-size: .8rem; text-transform: uppercase; }
  p { margin: .5rem 0; color: var(--tint-muted); font-size: .84rem; }
  @container (min-width: 780px) { .tile-demo { grid-template-columns: minmax(0, 1fr) 15rem; } }
</style>
