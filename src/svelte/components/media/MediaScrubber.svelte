<script lang="ts">
  import { clampUnit, normalizePeaks } from '../../../core/media/model'
  import Slider from './Slider.svelte'
  import Waveform from './Waveform.svelte'

  type Props = {
    progress: number
    onSeek: (percentage: number) => void
    waveform?: readonly number[]
    /** Canvas-parseable, resolved color. */
    color: string
    label: string
    tone?: 'surface' | 'chrome'
    class?: string
  }
  let { progress, onSeek, waveform, color, label, tone = 'surface', class: className }: Props = $props()
  let peaks = $derived(waveform?.length ? normalizePeaks(waveform) : undefined)
  let hoverProgress = $state<number | null>(null)

  function move(event: PointerEvent) {
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
    if (rect.width > 0) hoverProgress = clampUnit((event.clientX - rect.left) / rect.width)
  }
</script>

<div class={['tint-media-scrubber', className].filter(Boolean).join(' ')} data-tone={tone}>
  {#if peaks}
    <!-- The canvas adds pointer seeking without a second keyboard stop. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="waveform" role="presentation" onpointermove={move} onpointerleave={() => hoverProgress = null}>
      <Waveform {peaks} progress={progress / 100} {hoverProgress} {color} onSeek={(p) => onSeek(p * 100)} />
    </div>
  {/if}
  <Slider value={progress} onChange={onSeek} aria-label={`Seek ${label}`} showThumb class="slider" />
</div>

<style>
  .tint-media-scrubber { position: relative; min-width: 3rem; flex: 1; padding: .5rem 0; color: var(--tint-ink); }
  .tint-media-scrubber[data-tone='chrome'] { color: var(--tint-chrome-ink); }
  .waveform { position: absolute; top: 50%; right: 0; left: 0; height: 1rem; transform: translateY(-50%); }
  :global(.tint-media-scrubber .slider) { height: 1px; }
</style>
