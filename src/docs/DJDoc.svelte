<script lang="ts">
  import { AnalysisQueue, DualWaveform, TransitionAuditionControls, TransitionPresetPicker,
    type AnalysisQueueItem, type TransitionAuditionState, type TransitionPreset } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const peaks = Array.from({ length: 128 }, (_, index) => .15 + Math.abs(Math.sin(index * .22) * Math.cos(index * .073)) * .75)
  const incomingPeaks = Array.from({ length: 128 }, (_, index) => .12 + Math.abs(Math.sin(index * .31 + 1) * Math.cos(index * .055)) * .78)
  const viewport = { totalBeats: 64, widthPixels: 640, pixelsPerBeat: 10, scrollBeat: 0 }
  let preset = $state<TransitionPreset>('long-bass-swap')
  let auditionState = $state<TransitionAuditionState>('idle')
  let seekBeat = $state(0)
  let analysis = $state<AnalysisQueueItem[]>([
    { id: 'out', fileName: 'Night Drive.wav', status: 'ready', durationSeconds: 312 },
    { id: 'in', fileName: 'Afterglow.wav', status: 'error', error: 'Example decode error' },
  ])

  const api: ApiRow[] = [
    { prop: 'DualWaveform viewport / outgoing / incoming', type: 'TimelineViewport / tracks', description: 'Beat-space viewport and host-supplied waveform peaks.' },
    { prop: 'DualWaveform transition / onSeek', type: 'beat range / callback', description: 'Transition overlay and host seek intent.' },
    { prop: 'TransitionPresetPicker value / onChange', type: 'TransitionPreset / callback', description: 'Controlled transition style.' },
    { prop: 'TransitionAuditionControls state / onAudition / onStop', type: 'state / callbacks', description: 'Host-owned Web Audio audition lifecycle.' },
    { prop: 'AnalysisQueue items / onRetry', type: 'AnalysisQueueItem[] / callback', description: 'Track analysis status and retry intent.' },
  ]
  const usage = `import { DualWaveform, TransitionPresetPicker, TransitionAuditionControls } from '@nebula/tint/dj'

let preset = $state<TransitionPreset>('long-bass-swap')
<DualWaveform {viewport} {outgoing} {incoming} {transition}
  beatsPerBar={4} onSeek={(beat) => transport.seek(beat)} />
<TransitionPresetPicker value={preset} onChange={(next) => preset = next} />
<TransitionAuditionControls state={engine.snapshot.auditionState}
  onAudition={() => void engine.audition(schedule)} onStop={() => void engine.stop()} />`
</script>

<DocPage title="DJ and Audio Controls" description="Waveform, preset, audition, and analysis surfaces over host-owned audio state. This preview demonstrates UI intents; the full Midnight 128 workspace connects them to the shared Web Audio engine." importPath="@nebula/tint/dj" {usage} {api} accessibility="Preset choices are native radios, audition actions are named buttons with disabled states, queue errors have text alerts, and seek updates are echoed in a status line. Waveforms supplement host transport controls.">
  <div class="dj-demo">
    <DualWaveform {viewport} outgoing={{ label: 'Night Drive', peaks, color: 'var(--tint-accent)' }} incoming={{ label: 'Afterglow', peaks: incomingPeaks, color: 'var(--tint-info)' }} transition={{ startBeat: 28, endBeat: 44, label: 'Blend' }} beatsPerBar={4} onSeek={(beat) => seekBeat = beat} />
    <p aria-live="polite">Seek beat: {seekBeat.toFixed(1)}</p>
    <div class="controls"><TransitionPresetPicker value={preset} onChange={(next) => preset = next} /><div><h3>Audition</h3><TransitionAuditionControls state={auditionState} onAudition={() => auditionState = 'playing'} onStop={() => auditionState = 'idle'} /><p>Preview state: {auditionState} · Preset: {preset}</p></div></div>
    <AnalysisQueue items={analysis} onRetry={(id) => analysis = analysis.map((item) => item.id === id ? { ...item, status: 'ready', error: undefined, durationSeconds: 298 } : item)} />
  </div>
</DocPage>

<style>
  .dj-demo { display: grid; gap: 1.25rem; min-width: 0; }
  .controls { display: grid; gap: 1rem; }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  p { margin: 0; color: var(--tint-muted); font-size: .8rem; }
  @container (min-width: 700px) { .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
