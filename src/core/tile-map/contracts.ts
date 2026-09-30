export type TileTerrain = 'grass' | 'path' | 'water' | 'wall' | 'lab'

export type TileCell = {
  id: string
  x: number
  y: number
  terrain: TileTerrain
  blocked?: boolean
  source?: number
  atlasX?: number
  atlasY?: number
  alternative?: number
}

export type TileEntity = {
  id: string
  kind: 'player' | 'follower' | 'marker'
  x: number
  y: number
  label?: string
  color?: string
}

export type TileMapDocument = {
  id: string
  title: string
  tileSize: number
  width: number
  height: number
  cells: readonly TileCell[]
  entities?: readonly TileEntity[]
  spawn: { x: number; y: number }
  interaction?: { x: number; y: number; label: string }
}

export type TileMapMove = 'up' | 'down' | 'left' | 'right'
