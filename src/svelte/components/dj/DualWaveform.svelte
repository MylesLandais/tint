<script lang="ts">
  import BeatGridOverlay from '../timeline/BeatGridOverlay.svelte'
  import TransitionRegion from '../timeline/TransitionRegion.svelte'
  import WaveformCanvas from '../timeline/WaveformCanvas.svelte'
  import type { DualWaveformProps } from './types'

  let { viewport, outgoing, incoming, transition, beatsPerBar, positionBeat, onSeek, class: className }: DualWaveformProps = $props()
  let requestedBeat = $state<number | null>(null)
  let seekValue = $derived(Math.min(viewport.totalBeats, Math.max(0, positionBeat ?? requestedBeat ?? viewport.scrollBeat)))
  function seek(beat: number) { requestedBeat = beat; onSeek(beat) }
</script>

<section aria-label={`${outgoing.label} to ${incoming.label} waveforms`} data-tint-dual-waveform=""
  class={className ?? 'relative overflow-hidden rounded-lg border border-tint-border bg-tint-surface'}>
  <div class="relative h-24 border-b border-tint-border">
    <span class="absolute left-2 top-2 z-20 rounded bg-tint-surface/85 px-2 py-1 text-xs font-medium">{outgoing.label}</span>
    <WaveformCanvas {viewport} peaks={outgoing.peaks} color={outgoing.color} onSeek={seek} />
  </div>
  <div class="relative h-24">
    <span class="absolute left-2 top-2 z-20 rounded bg-tint-surface/85 px-2 py-1 text-xs font-medium">{incoming.label}</span>
    <WaveformCanvas {viewport} peaks={incoming.peaks} color={incoming.color} onSeek={seek} />
  </div>
  <BeatGridOverlay {viewport} {beatsPerBar} class="pointer-events-none absolute inset-0 z-10" />
  <TransitionRegion {viewport} startBeat={transition.startBeat} endBeat={transition.endBeat} label={transition.label}
    class="pointer-events-none absolute inset-y-0 z-10 border-x border-tint-accent/70 bg-tint-accent/10" />
  <label class="flex items-center gap-3 border-t border-tint-border px-3 py-2 text-xs text-tint-muted">
    <span>Seek mix timeline</span>
    <input type="range" min="0" max={viewport.totalBeats} step="1" value={seekValue}
      aria-valuetext={`Beat ${Math.round(seekValue)} of ${Math.round(viewport.totalBeats)}`}
      oninput={(event) => seek(Number(event.currentTarget.value))}
      class="min-w-0 flex-1 accent-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent" />
  </label>
</section>
