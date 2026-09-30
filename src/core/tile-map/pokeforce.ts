import type { TileCell, TileMapDocument } from './contracts'

export type PokeforceChunk = {
  path: string
  layerCount: number
  objectCount: number
  cells: readonly {
    x: number
    y: number
    layer: number
    z: number
    source: number
    atlasX: number
    atlasY: number
    alternative: number
  }[]
}

export type PokeforceMapRecord = {
  name: string
  origin: readonly [number, number]
  size: readonly [number, number]
  spawn: readonly [number, number]
  chunks: readonly PokeforceChunk[]
}

export type PokeforceMapPack = {
  schema: 'tint.pokeforce-map/v1'
  source: { archiveSha256: string; cacheSha256: string; maps: Readonly<Record<string, string>> }
  maps: Readonly<Record<string, PokeforceMapRecord>>
}

function terrainFor(source: number, atlasX: number, atlasY: number): TileCell['terrain'] {
  const signature = Math.abs(source * 31 + atlasX * 17 + atlasY * 13) % 11
  if (signature === 0) return 'water'
  if (signature === 1) return 'path'
  if (signature === 2) return 'lab'
  return 'grass'
}

/** Converts decoded PFCK records into Tint's renderer-neutral map document. */
export function createPokeforceTileMap(pack: PokeforceMapPack, mapId: 0 | 56 = 0): TileMapDocument {
  const record = pack.maps[String(mapId)]
  if (!record) throw new Error(`PokéForce map ${mapId} is not present in the pack`)
  const [originX, originY] = record.origin
  const cells: TileCell[] = record.chunks.flatMap((chunk) => chunk.cells.map((cell) => ({
    id: `${cell.x}:${cell.y}:${cell.layer}`,
    x: cell.x - originX,
    y: cell.y - originY,
    terrain: terrainFor(cell.source, cell.atlasX, cell.atlasY),
    source: cell.source,
    atlasX: cell.atlasX,
    atlasY: cell.atlasY,
    alternative: cell.alternative,
    blocked: cell.x === originX || cell.y === originY || cell.x === originX + record.size[0] - 1 || cell.y === originY + record.size[1] - 1,
  })))
  return {
    id: `pokeforce-${mapId}`,
    title: `${record.name} · decoded PFCK browser pack`,
    tileSize: 16,
    width: record.size[0],
    height: record.size[1],
    cells,
    spawn: { x: record.spawn[0] - originX, y: record.spawn[1] - originY },
    interaction: mapId === 0 ? { x: record.spawn[0] - originX + 1, y: record.spawn[1] - originY, label: 'Laboratory transition' } : undefined,
  }
}
