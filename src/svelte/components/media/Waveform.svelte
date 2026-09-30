<script lang="ts">
  import { onMount } from 'svelte'
  import { clampUnit } from '../../../core/media/model'

  type Props = {
    peaks: readonly number[]
    progress: number
    hoverProgress: number | null
    /** Canvas-parseable, resolved color. */
    color: string
    onSeek: (progress: number) => void
    class?: string
  }
  let { peaks, progress, hoverProgress, color, onSeek, class: className }: Props = $props()
  let canvas = $state<HTMLCanvasElement>(null!)

  function draw() {
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    if (peaks.length === 0 || width === 0 || height === 0) return
    const barWidth = width / peaks.length
    const gap = Math.max(.5, barWidth * .18)
    for (let index = 0; index < peaks.length; index += 1) {
      const amplitude = clampUnit(peaks[index])
      const position = index / peaks.length
      const barHeight = Math.max(2, amplitude * height * .88)
      context.fillStyle = hoverProgress !== null && position <= hoverProgress
        ? position <= progress ? color : `color-mix(in srgb, ${color} 33%, transparent)`
        : position <= progress ? color : 'color-mix(in srgb, currentColor 20%, transparent)'
      context.fillRect(index * barWidth, (height - barHeight) / 2, Math.max(0, barWidth - gap), barHeight)
    }
    if (progress > 0) {
      context.fillStyle = color
      context.fillRect(clampUnit(progress) * width - 1, 0, 2, height)
    }
  }

  $effect(() => { draw() })
  onMount(() => {
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(draw)
    observer?.observe(canvas)
    draw()
    return () => observer?.disconnect()
  })

  function seek(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0) onSeek(clampUnit((event.clientX - rect.left) / rect.width))
  }
</script>

<!-- Pointer-only enhancement behind the keyboard-accessible Slider. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<canvas bind:this={canvas} aria-hidden="true" class={['tint-waveform', className].filter(Boolean).join(' ')} onpointerdown={seek}></canvas>

<style>
  .tint-waveform { display: block; width: 100%; height: 100%; cursor: pointer; }
</style>
