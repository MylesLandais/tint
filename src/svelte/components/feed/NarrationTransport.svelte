<script lang="ts">
  import { DEFAULT_NARRATION_RATES, narrationProgress, narrationTimeAfterSkip } from '../../../core/feed'
  import ProgressBar from '../progress/ProgressBar.svelte'
  import type { NarrationTransportProps } from './types'

  let {
    src, label = 'Narration', rates = DEFAULT_NARRATION_RATES, onEnded,
    class: className, ...rest
  }: NarrationTransportProps = $props()

  let audio = $state<HTMLAudioElement>()
  let playing = $state(false)
  let current = $state(0)
  let duration = $state(0)
  let rate = $state(1)
  let progress = $derived(narrationProgress(current, duration))

  $effect(() => {
    const node = audio
    void src
    if (!node) return
    node.pause()
    node.load()
    playing = false
    current = 0
    duration = 0
  })

  $effect(() => {
    const node = audio
    if (node) node.playbackRate = rate
  })

  function toggle() {
    const node = audio
    if (!node) return
    if (node.paused) {
      void Promise.resolve(node.play()).then(() => { playing = true }).catch(() => { playing = false })
    } else {
      node.pause()
      playing = false
    }
  }

  function skip(delta: number) {
    const node = audio
    if (!node) return
    node.currentTime = narrationTimeAfterSkip(node.currentTime, delta, node.duration)
    current = node.currentTime
  }
</script>

<div {...rest} data-tint-narration-transport="" class={['narration-transport', className].filter(Boolean).join(' ')}>
  <audio
    bind:this={audio} {src} preload="metadata"
    ontimeupdate={(event) => { current = event.currentTarget.currentTime }}
    onloadedmetadata={(event) => { duration = event.currentTarget.duration || 0 }}
    onplay={() => { playing = true }}
    onpause={() => { playing = false }}
    onended={() => { playing = false; onEnded?.() }}
  ></audio>
  <div class="controls">
    <p class="label">{label}</p>
    <button type="button" aria-label="Skip back 10 seconds" onclick={() => skip(-10)}><span aria-hidden="true">↶</span></button>
    <button type="button" class="toggle" aria-label={`${playing ? 'Pause' : 'Play'} ${label}`} aria-pressed={playing} onclick={toggle}>
      <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span><span>{playing ? 'Pause' : 'Play'}</span>
    </button>
    <button type="button" aria-label="Skip forward 10 seconds" onclick={() => skip(10)}><span aria-hidden="true">↷</span></button>
    <label class="speed"><span class="sr-only">Playback speed</span><select aria-label="Playback speed" value={rate} onchange={(event) => { rate = Number(event.currentTarget.value) }}>
      {#each rates as value (value)}<option value={value}>{value}×</option>{/each}
    </select></label>
  </div>
  <ProgressBar value={progress} label={`${label} progress`} showValue={false} />
</div>

<style>
  .narration-transport { container-type: inline-size; display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-2); }
  .controls { display: flex; align-items: center; gap: var(--tint-space-2); }
  .label { min-width: 0; flex: 1; overflow: hidden; margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
  button { display: inline-flex; min-width: 2.25rem; min-height: 2.25rem; flex: none; align-items: center; justify-content: center; gap: var(--tint-space-1); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover { background: var(--tint-accent-soft); }
  button:focus-visible, select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .speed { display: flex; align-items: center; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  select { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: var(--tint-space-1); color: var(--tint-ink); font: inherit; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @container (max-width: 400px) { .controls { flex-wrap: wrap; } .label { flex-basis: 100%; } }
</style>
