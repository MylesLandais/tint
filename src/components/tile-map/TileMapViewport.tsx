import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/utils'
import { canEnter, movePoint } from './mock'
import type { TileMapViewportProps, TileTerrain } from './contracts'

const COLORS: Record<TileTerrain, string> = {
  grass: '#8bbf72',
  path: '#d9b878',
  water: '#5c9ec4',
  wall: '#34404a',
  lab: '#b8c4cf',
}

const KEY_DIRECTIONS = {
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
} as const

export function TileMapViewport({
  document,
  player,
  className,
  style,
  ariaLabel = 'Game map',
  onMove,
  onInteract,
  onKeyDown,
  onPointerDown,
}: TileMapViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const entities = useMemo(() => document.entities ?? [], [document.entities])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const scale = window.devicePixelRatio || 1
    canvas.width = document.width * document.tileSize * scale
    canvas.height = document.height * document.tileSize * scale
    canvas.style.aspectRatio = `${document.width * document.tileSize} / ${document.height * document.tileSize}`
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, canvas.width, canvas.height)
    for (const cell of document.cells) {
      const left = cell.x * document.tileSize
      const top = cell.y * document.tileSize
      const sourceTint = cell.source == null ? '' : `hsl(${Math.abs(cell.source * 37 + (cell.atlasX ?? 0) * 11 + (cell.atlasY ?? 0) * 7) % 360} 28% 62%)`
      context.fillStyle = sourceTint || COLORS[cell.terrain]
      context.fillRect(left, top, document.tileSize, document.tileSize)
      context.strokeStyle = 'rgba(20, 30, 35, .08)'
      context.strokeRect(left, top, document.tileSize, document.tileSize)
    }
    for (const entity of entities) {
      context.fillStyle = entity.color ?? (entity.kind === 'follower' ? '#e7873d' : '#5a4cc2')
      context.beginPath()
      context.arc(entity.x * document.tileSize + document.tileSize / 2, entity.y * document.tileSize + document.tileSize / 2, document.tileSize * .28, 0, Math.PI * 2)
      context.fill()
    }
    context.fillStyle = '#5a4cc2'
    context.fillRect(player.x * document.tileSize + 7, player.y * document.tileSize + 5, document.tileSize - 14, document.tileSize - 10)
    context.fillStyle = '#fff'
    context.fillRect(player.x * document.tileSize + 12, player.y * document.tileSize + 10, 4, 4)
  }, [document, entities, player])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = KEY_DIRECTIONS[event.key as keyof typeof KEY_DIRECTIONS]
    if (direction) {
      event.preventDefault()
      const next = movePoint(player, direction)
      if (canEnter(document, next)) onMove?.(direction)
    } else if (event.key === 'e' || event.key === 'Enter') {
      onInteract?.()
    }
    onKeyDown?.(event)
  }

  return (
    <button
      type="button"
      className={cn('overflow-auto rounded-xl border border-tint-border bg-black p-2 focus-visible:outline-2 focus-visible:outline-tint-accent', className)}
      style={style}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
    >
      <canvas ref={canvasRef} className="block h-auto min-w-[560px] max-w-full" aria-hidden="true" />
    </button>
  )
}
