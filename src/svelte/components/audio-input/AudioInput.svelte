<script lang="ts">
  import { onMount, tick } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { Mic, Square, X } from '@lucide/svelte'
  import { AudioInputSession } from '../../../core/audio-input/session'
  import type { AudioCaptureMeta, AudioInputSnapshot, AudioTranscriber } from '../../../core/audio-input/types'
  import { formatTime } from '../../../core/media/model'
  import Icon from '../icon/Icon.svelte'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onerror'> & {
    transcriber: AudioTranscriber
    value: string
    onValueChange: (value: string) => void
    onCapture?: (blob: Blob, meta: AudioCaptureMeta) => void
    onActiveChange?: (active: boolean) => void
    disabled?: boolean
    label?: string
  }
  let {
    transcriber, value, onValueChange, onCapture, onActiveChange,
    disabled = false, label = 'Voice input', class: className, ...rest
  }: Props = $props()
  let session = $state<AudioInputSession>()
  let mounted = $state(false)
  let snapshot: AudioInputSnapshot = $state({ status: 'idle', elapsed: 0 })
  let startButton = $state<HTMLButtonElement>()
  let active = $derived(['requesting', 'recording', 'stopping'].includes(snapshot.status))

  $effect(() => { session?.setCallbacks({ onValueChange, onCapture, onActiveChange }) })
  $effect(() => { if (mounted) session?.setTranscriber(transcriber) })

  onMount(() => {
    const current = new AudioInputSession(transcriber, { onValueChange, onCapture, onActiveChange })
    session = current
    const unsubscribe = current.subscribe((next) => {
      const wasActive = ['requesting', 'recording', 'stopping'].includes(snapshot.status)
      snapshot = next
      if (wasActive && next.status === 'idle') {
        void tick().then(() => startButton?.focus())
      }
    })
    current.mount()
    mounted = true
    return () => { mounted = false; unsubscribe(); current.dispose(); session = undefined }
  })
</script>

<div {...rest} data-tint-audio-input="" class={['tint-audio-input', className].filter(Boolean).join(' ')}>
  {#if active}
    <span role="status" class="recording-status">
      <span class="meter" data-recording={snapshot.status === 'recording'} aria-hidden="true">
        {#each [.45, .8, .6, 1, .55] as height}<span style:height={`${height * 100}%`}></span>{/each}
      </span>
      <span>{snapshot.status === 'requesting' ? 'Requesting mic…' : formatTime(snapshot.elapsed)}</span>
    </span>
    <button type="button" aria-label={`Cancel ${label}`} onclick={() => void session?.cancel()} disabled={snapshot.status === 'stopping'}><Icon icon={X} /></button>
    <button type="button" class="stop" aria-label={`Stop ${label}`} onclick={() => void session?.stop()} disabled={snapshot.status !== 'recording'}><Icon icon={Square} size="xs" /></button>
  {:else}
    <button bind:this={startButton} type="button" aria-label={snapshot.status === 'unsupported' ? 'Voice input unavailable' : `Start ${label}`} onclick={() => { if (!disabled) void session?.begin(value) }} disabled={disabled || snapshot.status === 'unsupported'}><Icon icon={Mic} /></button>
  {/if}
  {#if snapshot.error}<span role="alert" class="error">{snapshot.error}</span>{/if}
</div>

<style>
  .tint-audio-input { display: flex; align-items: center; gap: .25rem; container-type: inline-size; }
  button { display: inline-grid; width: 2rem; height: 2rem; flex: none; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-muted); cursor: pointer; }
  button:hover { background: var(--tint-surface); color: var(--tint-ink); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button.stop { background: var(--tint-accent); color: var(--tint-on-accent); }
  button.stop:hover { background: var(--tint-accent-hover); }
  .recording-status { display: inline-flex; align-items: center; gap: .375rem; border-radius: var(--tint-radius-sm); padding: .25rem .5rem; background: var(--tint-accent-soft); color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  .meter { display: inline-flex; height: 1rem; align-items: flex-end; gap: 1px; }
  .meter > span { width: 2px; border-radius: 1px; background: currentColor; }
  .meter[data-recording='true'] { animation: pulse 1s ease-in-out infinite; }
  .error { max-width: min(12rem, 100cqi); overflow: hidden; color: var(--tint-danger-ink); font-size: .6875rem; text-overflow: ellipsis; white-space: nowrap; }
  @keyframes pulse { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { .meter[data-recording='true'] { animation: none; } }
</style>
