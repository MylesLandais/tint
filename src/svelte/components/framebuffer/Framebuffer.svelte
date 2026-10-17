<script lang="ts">
  import { untrack } from 'svelte'
  import type { HTMLCanvasAttributes } from 'svelte/elements'
  import { FramebufferStream, type FrameEncoding, type FrameMode, type FrameDemand } from '../../../core/framebuffer'

  type Props = {
    url: string
    accountId: string
    encoding?: FrameEncoding
    mode?: FrameMode
    demand?: FrameDemand
    onStatus?: (status: string) => void
    showStatus?: boolean
    canvasProps?: HTMLCanvasAttributes
    class?: string
  }
  let {
    url, accountId, encoding = 'rgba', mode = 'frame', demand = 'selected', onStatus,
    showStatus = true, canvasProps, class: className,
  }: Props = $props()
  let active = $state.raw<FramebufferStream | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)
  let canvasGeneration = $state(0)
  let status = $state('Connecting')
  const connectionKey = $derived(JSON.stringify({ url, accountId, encoding, mode, forceWebGL: canvasGeneration > 0 }))

  $effect(() => {
    if (!canvas) return
    const options = JSON.parse(connectionKey)
    const stream = new FramebufferStream(canvas, {
      ...options, demand: untrack(() => demand),
      onContextLost: () => { canvasGeneration += 1 },
    }, (next) => {
      status = next
      untrack(() => onStatus?.(next))
    })
    active = stream
    stream.start()
    return () => { stream.dispose(); if (active === stream) active = null }
  })
  $effect(() => { active?.setDemand(demand) })
</script>

<div data-tint-framebuffer="" class={['tint-framebuffer', className].filter(Boolean).join(' ')}>
  {#key canvasGeneration}
    <canvas {...canvasProps} bind:this={canvas} role={canvasProps?.role ?? 'img'} class={['framebuffer-canvas', canvasProps?.class].filter(Boolean).join(' ')} aria-label={canvasProps?.['aria-label'] ?? `${accountId} native framebuffer`}></canvas>
  {/key}
  {#if showStatus}<p role="status">{accountId} · {status}</p>{/if}
</div>

<style>
  .tint-framebuffer { width: 100%; height: 100%; }
  .framebuffer-canvas { width: 100%; height: 100%; object-fit: contain; }
  p { margin: .4rem 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
</style>
