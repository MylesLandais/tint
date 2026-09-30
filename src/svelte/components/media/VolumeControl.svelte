<script lang="ts">
  import { onMount } from 'svelte'
  import { Volume1, Volume2, VolumeX } from '@lucide/svelte'
  import { clampPercent } from '../../../core/media/model'
  import Icon from '../icon/Icon.svelte'
  import Slider from './Slider.svelte'

  type Props = {
    /** Unit interval, 0–1. */
    volume: number
    isMuted: boolean
    onVolumeChange: (percentage: number) => void
    onToggleMute: () => void
    /** Optional controlled drawer state. */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    tone?: 'chrome' | 'surface'
    class?: string
  }

  let {
    volume, isMuted, onVolumeChange, onToggleMute, open: controlledOpen,
    onOpenChange, tone = 'chrome', class: className,
  }: Props = $props()
  const drawerId = $props.id()
  let root = $state<HTMLDivElement>(null!)
  let input = $state<HTMLInputElement>()
  let localOpen = $state(false)
  let editing = $state(false)
  let inputValue = $state('100')
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let isOpen = $derived(controlledOpen ?? localOpen)
  let displayVolume = $derived(isMuted ? 0 : clampPercent(volume * 100))
  let volumeGlyph = $derived(isMuted || volume === 0 ? VolumeX : volume > .5 ? Volume2 : Volume1)

  $effect(() => { if (!editing) inputValue = String(Math.round(displayVolume)) })

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) localOpen = next
    onOpenChange?.(next)
    if (!next) editing = false
  }

  function openDrawer() {
    clearTimeout(closeTimer)
    if (!isOpen) setOpen(true)
  }

  function scheduleClose() {
    if (editing) return
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => setOpen(false), 160)
  }

  function commitInput() {
    const next = Math.round(clampPercent(Number(inputValue)))
    inputValue = String(next)
    onVolumeChange(next)
    editing = false
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitInput()
      input?.blur()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = Math.round(clampPercent(Number(inputValue || displayVolume) + (event.key === 'ArrowUp' ? 1 : -1)))
      inputValue = String(next)
      onVolumeChange(next)
    }
  }

  onMount(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (isOpen && event.target instanceof Node && !root.contains(event.target)) {
        if (editing) commitInput()
        setOpen(false)
      }
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (!isOpen || event.key !== 'Escape') return
      event.preventDefault()
      if (editing) {
        inputValue = String(Math.round(displayVolume))
        editing = false
        input?.blur()
      } else setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
    return () => {
      clearTimeout(closeTimer)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeydown)
    }
  })
</script>

<div
  bind:this={root}
  role="group"
  aria-label="Volume controls"
  class={['tint-volume', className].filter(Boolean).join(' ')}
  data-tone={tone}
  onpointerenter={openDrawer}
  onpointerleave={scheduleClose}
  onfocusin={openDrawer}
  onfocusout={(event) => { if (!root.contains(event.relatedTarget as Node | null)) scheduleClose() }}
>
  <button
    type="button"
    class="mute-button"
    aria-label={isMuted ? 'Unmute' : 'Mute'}
    aria-expanded={isOpen}
    aria-controls={drawerId}
    onclick={onToggleMute}
  ><Icon icon={volumeGlyph} /></button>

  {#if isOpen}
    <div id={drawerId} role="dialog" aria-label="Volume" class="drawer">
      <form onsubmit={(event) => { event.preventDefault(); commitInput() }}>
        <input
          bind:this={input}
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          aria-label="Volume percentage"
          value={inputValue}
          onfocus={() => { editing = true; openDrawer() }}
          onblur={() => { if (editing) commitInput() }}
          oninput={(event) => { editing = true; inputValue = event.currentTarget.value.replace(/[^\d]/g, '').slice(0, 3) }}
          onkeydown={onInputKeydown}
        />
      </form>
      <div class="range"><Slider orientation="vertical" value={displayVolume} onChange={(value) => { editing = false; onVolumeChange(value) }} aria-label="Volume" /></div>
    </div>
  {/if}
</div>

<style>
  .tint-volume { position: relative; color: var(--tint-chrome-ink); }
  .tint-volume[data-tone='surface'] { color: var(--tint-ink); }
  .mute-button { display: inline-grid; width: 2rem; height: 2rem; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: inherit; cursor: pointer; }
  .mute-button:hover, .mute-button[aria-expanded='true'] { background: color-mix(in srgb, currentColor 12%, transparent); }
  .mute-button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .drawer { position: absolute; bottom: calc(100% + .5rem); left: 50%; z-index: 30; display: flex; width: 3.5rem; height: 9rem; flex-direction: column; align-items: center; padding: .5rem .5rem .75rem; border: 1px solid var(--tint-chrome-border); border-radius: var(--tint-radius-lg); background: var(--tint-chrome); box-shadow: 0 12px 32px var(--tint-shadow-color); transform: translateX(-50%); }
  [data-tone='surface'] .drawer { border-color: var(--tint-border); background: var(--tint-panel); }
  form { width: 100%; margin-bottom: .625rem; }
  input { width: 100%; border: 0; border-bottom: 1px solid currentColor; background: transparent; color: inherit; font: inherit; font-size: .6875rem; font-variant-numeric: tabular-nums; text-align: center; outline: none; }
  input:focus-visible { border-color: var(--tint-accent); }
  .range { display: flex; min-height: 0; width: 100%; flex: 1; justify-content: center; }
</style>
