import { canEnter, movePoint } from './mock'
import type { TileMapDocument, TileMapMove, TileTerrain } from './contracts'

const TERRAIN_COLORS: Record<TileTerrain, string> = {
  grass: '#8bbf72', path: '#d9b878', water: '#5c9ec4', wall: '#34404a', lab: '#b8c4cf',
}
const DIRECTIONS: Readonly<Record<string, TileMapMove>> = {
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
}

export type TileMapKeyIntent = { type: 'move'; direction: TileMapMove; allowed: boolean } | { type: 'interact' }

/** Keyboard intent is independent of React or Svelte; the host owns player movement. */
export function tileMapKeyIntent(document: TileMapDocument, player: { x: number; y: number }, key: string): TileMapKeyIntent | null {
  const direction = DIRECTIONS[key]
  if (direction) return { type: 'move', direction, allowed: canEnter(document, movePoint(player, direction)) }
  if (key === 'e' || key === 'Enter') return { type: 'interact' }
  return null
}

/** Canvas rendering is framework neutral and uses the original authored map palette. */
export function renderTileMap(canvas: HTMLCanvasElement, document: TileMapDocument, player: { x: number; y: number }, pixelRatio = 1): void {
  const scale = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1
  const width = document.width * document.tileSize
  const height = document.height * document.tileSize
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.style.aspectRatio = `${width} / ${height}`
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, width, height)
  for (const cell of document.cells) {
    const left = cell.x * document.tileSize
    const top = cell.y * document.tileSize
    const sourceTint = cell.source == null ? '' : `hsl(${Math.abs(cell.source * 37 + (cell.atlasX ?? 0) * 11 + (cell.atlasY ?? 0) * 7) % 360} 28% 62%)`
    context.fillStyle = sourceTint || TERRAIN_COLORS[cell.terrain]
    context.fillRect(left, top, document.tileSize, document.tileSize)
    context.strokeStyle = 'rgba(20, 30, 35, .08)'
    context.strokeRect(left, top, document.tileSize, document.tileSize)
  }
  for (const entity of document.entities ?? []) {
    context.fillStyle = entity.color ?? (entity.kind === 'follower' ? '#e7873d' : '#5a4cc2')
    context.beginPath()
    context.arc(entity.x * document.tileSize + document.tileSize / 2, entity.y * document.tileSize + document.tileSize / 2, document.tileSize * .28, 0, Math.PI * 2)
    context.fill()
  }
  context.fillStyle = '#5a4cc2'
  context.fillRect(player.x * document.tileSize + 7, player.y * document.tileSize + 5, document.tileSize - 14, document.tileSize - 10)
  context.fillStyle = '#fff'
  context.fillRect(player.x * document.tileSize + 12, player.y * document.tileSize + 10, 4, 4)
}
