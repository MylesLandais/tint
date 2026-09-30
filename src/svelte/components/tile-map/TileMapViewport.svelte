<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { renderTileMap, tileMapKeyIntent, type TileMapDocument, type TileMapMove } from '../../../core/tile-map'

  type Props = Omit<HTMLButtonAttributes, 'children' | 'onkeydown' | 'onpointerdown'> & {
    document: TileMapDocument
    player: { x: number; y: number }
    ariaLabel?: string
    onMove?: (direction: TileMapMove) => void
    onInteract?: () => void
    onKeyDown?: (event: KeyboardEvent) => void
    onPointerDown?: (event: PointerEvent) => void
    className?: string
  }
  let {
    document, player, ariaLabel = 'Game map', onMove, onInteract,
    onKeyDown, onPointerDown, class: className, className: legacyClassName,
    ...rest
  }: Props = $props()
  let canvas = $state<HTMLCanvasElement | null>(null)

  $effect(() => {
    if (canvas) renderTileMap(canvas, document, player, window.devicePixelRatio || 1)
  })

  function handleKeyDown(event: KeyboardEvent) {
    const intent = tileMapKeyIntent(document, player, event.key)
    if (intent?.type === 'move') {
      event.preventDefault()
      if (intent.allowed) onMove?.(intent.direction)
    } else if (intent?.type === 'interact') onInteract?.()
    onKeyDown?.(event)
  }
</script>

<button {...rest} type="button" data-tint-tile-map="" class={['tile-map', className, legacyClassName].filter(Boolean).join(' ')} aria-label={ariaLabel} onkeydown={handleKeyDown} onpointerdown={(event) => onPointerDown?.(event)}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</button>

<style>
  .tile-map { display: block; max-width: 100%; overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-map-background, #000); padding: var(--tint-space-2); cursor: default; }
  .tile-map:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  canvas { display: block; width: 100%; min-width: 560px; height: auto; image-rendering: pixelated; }
</style>
