import type { TileCell, TileMapDocument, TileMapMove } from './contracts'

const WIDTH = 24
const HEIGHT = 14

function cell(x: number, y: number): TileCell {
  const wall = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1
  const water = x >= 2 && x <= 5 && y >= 2 && y <= 5
  const lab = x >= 17 && x <= 21 && y >= 2 && y <= 5
  const path = y === 8 || x === 12 || (x >= 17 && y === 6)
  return {
    id: `${x}:${y}`,
    x,
    y,
    terrain: wall ? 'wall' : water ? 'water' : lab ? 'lab' : path ? 'path' : 'grass',
    blocked: wall || water || (lab && y < 5),
  }
}

export function createMockTileMap(): TileMapDocument {
  return {
    id: 'newbark-demo',
    title: 'New Bark Town · local reconstruction',
    tileSize: 32,
    width: WIDTH,
    height: HEIGHT,
    cells: Array.from({ length: WIDTH * HEIGHT }, (_, index) => cell(index % WIDTH, Math.floor(index / WIDTH))),
    spawn: { x: 12, y: 8 },
    interaction: { x: 19, y: 6, label: 'Laboratory entrance' },
  }
}

export function movePoint(point: { x: number; y: number }, direction: TileMapMove) {
  const delta = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }[direction]
  return { x: point.x + delta.x, y: point.y + delta.y }
}

export function canEnter(document: TileMapDocument, point: { x: number; y: number }) {
  return document.cells.some((candidate) => candidate.x === point.x && candidate.y === point.y && !candidate.blocked)
}
