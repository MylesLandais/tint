import { canEnter, createMockTileMap, movePoint } from './mock'
import type { TileMapDocument, TileMapMove } from './contracts'
import { createPokeforceTileMap, type PokeforceMapPack } from './pokeforce'

export type ExplorationSnapshot = {
  document: TileMapDocument
  position: { x: number; y: number }
  revision: number
  notice: string
}

export type ExplorationClient = {
  getSnapshot: () => ExplorationSnapshot
  subscribe: (listener: () => void) => () => void
  move: (direction: TileMapMove) => Promise<ExplorationSnapshot>
  interact: () => Promise<ExplorationSnapshot>
}

function createExplorationClient(document: TileMapDocument, returnMap?: TileMapDocument, homeMap = document): ExplorationClient {
  let snapshot: ExplorationSnapshot = {
    document,
    position: document.spawn,
    revision: 0,
    notice: 'Local exploration session ready.',
  }
  const listeners = new Set<() => void>()
  const publish = (next: ExplorationSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
    return snapshot
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async move(direction) {
      const next = movePoint(snapshot.position, direction)
      if (!canEnter(snapshot.document, next)) {
        return publish({ ...snapshot, notice: 'Movement rejected by terrain collision.' })
      }
      return publish({
        ...snapshot,
        position: next,
        revision: snapshot.revision + 1,
        notice: `MoveIntent accepted · ${direction}`,
      })
    },
    async interact() {
      const interaction = snapshot.document.interaction
      const adjacent = interaction && Math.abs(snapshot.position.x - interaction.x) + Math.abs(snapshot.position.y - interaction.y) <= 1
      if (adjacent && returnMap) {
        const target = snapshot.document.id === returnMap.id ? homeMap : returnMap
        return publish({
          ...snapshot,
          document: target,
          position: target.spawn,
          revision: snapshot.revision + 1,
          notice: `InteractIntent accepted · ${interaction.label}`,
        })
      }
      return publish({ ...snapshot, notice: `InteractIntent · ${interaction?.label ?? 'no interaction nearby'}` })
    },
  }
}

/** Deterministic browser adapter used by the docs demo and component tests. */
export function createMockExplorationClient(document = createMockTileMap()): ExplorationClient {
  return createExplorationClient(document)
}

export function createPokeforceExplorationClient(pack: PokeforceMapPack): ExplorationClient {
  const outdoor = createPokeforceTileMap(pack, 0)
  const laboratory = createPokeforceTileMap(pack, 56)
  const outdoorWithDoor = { ...outdoor, interaction: { x: outdoor.spawn.x + 1, y: outdoor.spawn.y, label: 'Laboratory entrance' } }
  const labWithDoor = { ...laboratory, interaction: { x: laboratory.spawn.x, y: laboratory.spawn.y + 1, label: 'Return to New Bark Town' } }
  return createExplorationClient(outdoorWithDoor, labWithDoor, outdoorWithDoor)
}
