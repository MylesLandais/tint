<script lang="ts">
  import { onMount } from 'svelte'
  import type { TimelineViewport } from '../../../core/timeline/contracts'
  import { beatToPixel, pixelToBeat, timelineVisibleRange } from '../../../core/timeline/viewport'
  import { observeCanvasTheme, resolveCanvasColor } from '../../../core/timeline/color'

  type Props = {
    viewport: TimelineViewport
    peaks: readonly number[]
    color: string
    onSeek: (beat: number) => void
    class?: string
  }
  let { viewport, peaks, color, onSeek, class: className }: Props = $props()
  let canvas = $state<HTMLCanvasElement | null>(null)
  let keyboardBeat = $state(0)
  let visible = $derived(timelineVisibleRange(viewport))
  let selectedBeat = $derived(Math.max(visible.startBeat, Math.min(visible.endBeat, keyboardBeat)))

  function draw() {
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const width = viewport.widthPixels
    const height = canvas.offsetHeight || 80
    const deviceScale = window.devicePixelRatio || 1
    canvas.width = width * deviceScale
    canvas.height = height * deviceScale
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = resolveCanvasColor(canvas, color)
    if (!peaks.length) return
    const visible = timelineVisibleRange(viewport)
    const beatPerPeak = viewport.totalBeats / peaks.length
    const first = Math.max(0, Math.floor(visible.startBeat / beatPerPeak))
    const last = Math.min(peaks.length - 1, Math.ceil(visible.endBeat / beatPerPeak))
    const barWidth = Math.max(1, beatPerPeak * viewport.pixelsPerBeat)
    const midpoint = height / 2
    for (let index = first; index <= last; index += 1) {
      const amplitude = Math.min(1, Math.max(0, peaks[index] ?? 0))
      const barHeight = Math.max(1, amplitude * height * .9)
      context.fillRect(beatToPixel(viewport, index * beatPerPeak), midpoint - barHeight / 2, barWidth, barHeight)
    }
  }

  $effect(() => { draw() })
  onMount(() => {
    if (!canvas) return
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(draw)
    observer?.observe(canvas)
    const stopThemeObserver = observeCanvasTheme(canvas, draw)
    return () => { observer?.disconnect(); stopThemeObserver() }
  })

  function seek(event: MouseEvent) {
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    if (bounds.width <= 0) return
    const viewportPixel = ((event.clientX - bounds.left) / bounds.width) * viewport.widthPixels
    const beat = pixelToBeat(viewport, viewportPixel)
    keyboardBeat = Math.min(viewport.totalBeats, Math.max(0, beat))
    onSeek(keyboardBeat)
  }

  function keyboardSeek(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSeek(selectedBeat)
      return
    }
    const step = event.shiftKey ? 4 : 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') keyboardBeat = Math.max(visible.startBeat, selectedBeat - step)
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') keyboardBeat = Math.min(visible.endBeat, selectedBeat + step)
    else if (event.key === 'Home') keyboardBeat = visible.startBeat
    else if (event.key === 'End') keyboardBeat = visible.endBeat
    else return
    event.preventDefault()
  }
</script>

<canvas bind:this={canvas} role="button" tabindex="0"
  aria-label={`Seek waveform, selected beat ${Number(selectedBeat.toFixed(2))}. Use arrow keys to choose a beat, then Enter to seek.`}
  data-tint-waveform-canvas="" class={className ?? 'size-full cursor-pointer touch-none'}
  onclick={seek} onkeydown={keyboardSeek}></canvas>

<style>
  canvas:focus-visible { outline: var(--tint-focus-width, 2px) solid var(--tint-focus, currentColor); outline-offset: 2px; }
</style>
