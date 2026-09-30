<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { Maximize, Minimize, Pause, Play, Settings } from '@lucide/svelte'
  import { formatTime, playbackProgress } from '../../../core/media/model'
  import { MediaTransport, type MediaTransportSnapshot } from '../../../core/media/transport'
  import Icon from '../icon/Icon.svelte'
  import Slider from './Slider.svelte'
  import SettingsPopout from './SettingsPopout.svelte'
  import VolumeControl from './VolumeControl.svelte'
  import type { MediaPlayerVideoProps } from './playerTypes'

  type Props = Omit<MediaPlayerVideoProps, 'kind' | 'label'> & { kind?: 'video'; label?: string }
  let {
    kind: _kind, src, label = 'Video', title, poster, tracks = [], duration: durationHint,
    playbackSpeeds = [0.5, 1, 1.5, 2], autoHideControls = true,
    size, shadow = false, class: className, onPlay, onPause,
    waveform: _waveform, onPrevious: _onPrevious, onNext: _onNext,
    ...videoAttrs
  }: Props = $props()
  const transport = new MediaTransport()
  let root = $state<HTMLDivElement>(null!)
  let video = $state<HTMLVideoElement>(null!)
  let mounted = $state(false)
  let snapshot: MediaTransportSnapshot = $state(transport.snapshot)
  let showControls = $state(true)
  let settingsOpen = $state(false)
  let volumeOpen = $state(false)
  let playbackSpeed = $state(1)
  let fullscreen = $state(false)
  let theater = $state(false)
  let previousSource: { src: string; durationHint?: number } | undefined

  let playerTitle = $derived(title ?? label)
  let progress = $derived(playbackProgress(snapshot.currentTime, snapshot.duration))
  let speedItems = $derived(playbackSpeeds.map((speed) => ({
    id: `speed-${speed}`, label: `${speed}x`, group: 'Playback speed',
    description: `Play at ${speed} times normal speed`,
  })))

  $effect(() => { transport.setCallbacks({ onPlay, onPause }) })
  $effect(() => { showControls = !autoHideControls })
  $effect(() => {
    if (!mounted) return
    if (previousSource?.src !== src || previousSource.durationHint !== durationHint) {
      transport.reset(durationHint)
      previousSource = { src, durationHint }
    }
  })

  function setSpeed(speed: number) {
    video.playbackRate = speed
    playbackSpeed = speed
  }

  function revealControls() { if (autoHideControls) showControls = true }
  function maybeHideControls() { if (autoHideControls && !settingsOpen && !volumeOpen) showControls = false }

  async function toggleFullscreen() {
    if (fullscreen) {
      try { await document.exitFullscreen() } catch { /* Keep current surface. */ }
    } else if (theater) theater = false
    else {
      try {
        if (!root.requestFullscreen) throw new Error('Element fullscreen unavailable')
        await root.requestFullscreen()
      } catch { theater = true }
    }
  }

  $effect(() => {
    if (!theater || !root) return
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void tick().then(() => { if (theater) root.focus() })
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !settingsOpen && !volumeOpen) { event.preventDefault(); theater = false; return }
      if (event.key !== 'Tab') return
      const focusable = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"], input:not(:disabled)'))
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeydown)
    return () => { document.removeEventListener('keydown', onKeydown); document.body.style.overflow = previousOverflow; restore?.focus() }
  })

  onMount(() => {
    const unsubscribe = transport.subscribe((next) => { snapshot = next })
    const detach = transport.attach(video)
    const onFullscreenChange = () => { fullscreen = document.fullscreenElement === root }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    mounted = true
    return () => { mounted = false; document.removeEventListener('fullscreenchange', onFullscreenChange); detach(); unsubscribe() }
  })
</script>

<!-- The focusable group reveals controls when the keyboard reaches the player. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={root}
  data-tint-video-player=""
  data-size={size}
  data-shadow={shadow ? 'offset' : undefined}
  data-fullscreen={fullscreen ? 'true' : undefined}
  data-theater={theater ? 'true' : undefined}
  role={theater ? 'dialog' : 'group'}
  aria-modal={theater ? 'true' : undefined}
  aria-label={theater ? playerTitle : `${playerTitle} player`}
  tabindex={theater ? -1 : 0}
  class={['tint-video-player', className].filter(Boolean).join(' ')}
  onpointerenter={revealControls}
  onpointerleave={maybeHideControls}
  onfocusin={revealControls}
  onfocusout={(event) => { if (!root.contains(event.relatedTarget as Node | null)) maybeHideControls() }}
>
  <video
    bind:this={video}
    {...videoAttrs}
    {src}
    {poster}
    aria-label={label}
    class="video"
    onclick={() => transport.toggle()}
  >
    {#each tracks as track (`${track.kind}:${track.srcLang}:${track.src}`)}
      <track src={track.src} kind={track.kind} srclang={track.srcLang} label={track.label} default={track.default} />
    {/each}
  </video>

  {#if showControls}
    <div class="chrome">
      <p class="title">{playerTitle}</p>
      {#if snapshot.failed}<p role="alert" class="error">This video could not be played.</p>{/if}
      <div class="controls">
        <button type="button" data-video-transport="" aria-label={snapshot.playing ? `Pause ${label}` : `Play ${label}`} onclick={() => transport.toggle()} disabled={snapshot.failed}><Icon icon={snapshot.playing ? Pause : Play} size="sm" /></button>
        <span class="time">{formatTime(snapshot.currentTime)}</span>
        <Slider value={progress} onChange={(value) => transport.seek(value)} aria-label={`Seek ${label}`} class="seek" />
        <span class="time">{formatTime(snapshot.duration)}</span>
        <VolumeControl volume={snapshot.volume} isMuted={snapshot.muted} onVolumeChange={(value) => transport.changeVolume(value)} onToggleMute={() => transport.toggleMute()} open={volumeOpen} onOpenChange={(open) => { if (open) settingsOpen = false; volumeOpen = open }} />
        <SettingsPopout isOpen={settingsOpen} onOpenChange={(open) => { if (open) volumeOpen = false; settingsOpen = open }} items={speedItems} value={`speed-${playbackSpeed}`} onSelect={(id) => { const speed = Number(id.replace('speed-', '')); if (Number.isFinite(speed)) setSpeed(speed) }} label="Player settings">
          {#snippet trigger(triggerProps)}
            <button
              id={triggerProps.id}
              type="button"
              aria-label="Settings"
              aria-haspopup={triggerProps['aria-haspopup']}
              aria-expanded={triggerProps['aria-expanded']}
              aria-controls={triggerProps['aria-controls']}
              data-tint-trigger=""
              onclick={triggerProps.onclick}
            ><Icon icon={Settings} size="sm" /></button>
          {/snippet}
        </SettingsPopout>
        <button type="button" aria-label={fullscreen || theater ? 'Exit fullscreen' : 'Enter fullscreen'} onclick={() => void toggleFullscreen()}><Icon icon={fullscreen || theater ? Minimize : Maximize} size="sm" /></button>
      </div>
    </div>
  {/if}
</div>

<style>
  .tint-video-player { position: relative; width: 100%; max-width: 56rem; margin-inline: auto; border-radius: var(--tint-radius-lg); background: var(--tint-chrome); box-shadow: 0 0 20px var(--tint-shadow-color); container-type: inline-size; }
  .tint-video-player[data-size='sm'] { max-width: 36rem; }
  .tint-video-player[data-size='md'] { max-width: 48rem; }
  .tint-video-player[data-shadow='offset'] { box-shadow: 6px 6px 0 var(--tint-shadow-color); }
  .tint-video-player:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .video { display: block; width: 100%; border-radius: inherit; background: black; cursor: pointer; }
  .chrome { position: absolute; right: 17%; bottom: .75rem; left: 17%; z-index: 20; display: flex; flex-direction: column; gap: .5rem; padding: .625rem .75rem; border-radius: var(--tint-radius-lg); background: var(--tint-chrome); color: var(--tint-chrome-ink); }
  .title { margin: 0; overflow: hidden; font-size: var(--tint-font-size-xs); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
  .error { margin: 0; color: var(--tint-danger-ink); font-size: var(--tint-font-size-xs); }
  .controls { display: flex; align-items: center; gap: .5rem; }
  .controls button { display: inline-grid; width: 2rem; height: 2rem; flex: none; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: inherit; cursor: pointer; }
  .controls button:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
  .controls button:focus-visible { outline: 2px solid var(--tint-chrome-ink); outline-offset: 2px; }
  .controls button:disabled { cursor: not-allowed; opacity: .4; }
  .time { min-width: 2.25rem; flex: none; font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  .time:nth-of-type(2) { text-align: right; }
  :global(.tint-video-player .seek) { min-width: 1rem; flex: 1; color: var(--tint-chrome-ink); }
  @container (max-width: 40rem) { .chrome { right: .5rem; left: .5rem; } }
</style>
