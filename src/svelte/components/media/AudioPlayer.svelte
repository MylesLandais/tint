<script lang="ts">
  import { onMount } from 'svelte'
  import { Pause, Play, SkipBack, SkipForward } from '@lucide/svelte'
  import { clampUnit, formatTime, playbackProgress, remainingTime } from '../../../core/media/model'
  import { MediaTransport, type MediaTransportSnapshot } from '../../../core/media/transport'
  import Icon from '../icon/Icon.svelte'
  import Spinner from '../icon/Spinner.svelte'
  import MediaPlaceholder from './MediaPlaceholder.svelte'
  import MediaScrubber from './MediaScrubber.svelte'
  import VolumeControl from './VolumeControl.svelte'
  import type { MediaPlayerAudioProps } from './playerTypes'

  let {
    src, label, title, duration: durationHint, waveform, shadow = false, size,
    class: className, onPlay, onPause, onPrevious, onNext,
    artist, artwork, artworkAlt = '', playing: playingOverride, playbackNonce,
    remote, onEnded,
  }: MediaPlayerAudioProps = $props()
  const transport = new MediaTransport()
  let root = $state<HTMLDivElement>(null!)
  let audio = $state<HTMLAudioElement>(null!)
  let mounted = $state(false)
  let snapshot: MediaTransportSnapshot = $state(transport.snapshot)
  let failedArtwork = $state<{ src: string; artwork: string }>()
  let accentColor = $state('#0f6e56')
  let lastAudibleVolume = 1
  let previous: { src: string; durationHint?: number; playing?: boolean; nonce?: number } | undefined
  let previouslyRemote = false
  let remotePlaying: boolean | undefined
  let remoteVolume: number | undefined

  let playing = $derived(remote?.playing ?? snapshot.playing)
  let currentTime = $derived(remote?.currentTime ?? snapshot.currentTime)
  let duration = $derived(remote?.duration ?? snapshot.duration)
  let volume = $derived(remote?.volume ?? snapshot.volume)
  let muted = $derived(remote?.muted ?? snapshot.muted)
  let progress = $derived(playbackProgress(currentTime, duration))
  let remaining = $derived(remainingTime(currentTime, duration))

  $effect(() => { transport.setCallbacks({ onPlay, onPause, onEnded }) })

  $effect(() => {
    if (!mounted) return
    if (remote) { previouslyRemote = true; return }
    const changed = previouslyRemote || !previous || previous.src !== src || previous.durationHint !== durationHint
    if (changed) transport.reset(durationHint)
    const newNonce = playbackNonce !== undefined && playbackNonce !== 0 && playbackNonce !== previous?.nonce
    if (newNonce || (playingOverride === true && (changed || previous?.playing !== playingOverride))) transport.playFromStart()
    else if (playingOverride === false && (changed || previous?.playing !== playingOverride)) transport.pause()
    previous = { src, durationHint, playing: playingOverride, nonce: playbackNonce }
    previouslyRemote = false
  })

  $effect(() => {
    if (!mounted || !remote) { remotePlaying = undefined; remoteVolume = undefined; return }
    const level = clampUnit(remote.volume)
    if (level !== remoteVolume) {
      audio.volume = level
      if (level > 0) lastAudibleVolume = level
      remoteVolume = level
    }
    if (remote.playing !== remotePlaying) {
      if (remote.playing) startNetworkSink()
      else if (!audio.paused) audio.pause()
      remotePlaying = remote.playing
    }
  })

  function startNetworkSink() {
    try { void Promise.resolve(audio.play()).catch(() => undefined) } catch { /* User gesture can unlock it later. */ }
  }

  function toggle() {
    if (!remote) { transport.toggle(); return }
    if (remote.playing) { audio.pause(); remote.onPause() }
    else { startNetworkSink(); remote.onPlay() }
  }

  function seek(percentage: number) {
    if (remote) { if (remote.duration > 0) remote.onSeek(percentage / 100 * remote.duration) }
    else transport.seek(percentage)
  }

  function changeVolume(percentage: number) {
    if (!remote) { transport.changeVolume(percentage); return }
    const level = clampUnit(percentage / 100)
    audio.volume = level
    if (level > 0) lastAudibleVolume = level
    remote.onVolumeChange(level)
  }

  function toggleMute() {
    if (!remote) { transport.toggleMute(); return }
    remote.onVolumeChange(muted || volume === 0 ? lastAudibleVolume : 0)
  }

  onMount(() => {
    const unsubscribe = transport.subscribe((next) => { snapshot = next })
    const detach = transport.attach(audio)
    mounted = true
    const resolveAccent = () => {
      const value = getComputedStyle(root).getPropertyValue('--tint-accent').trim()
      if (value) accentColor = value
    }
    resolveAccent()
    const observer = new MutationObserver(resolveAccent)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-scheme'] })
    const scheme = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined
    scheme?.addEventListener('change', resolveAccent)
    return () => { mounted = false; scheme?.removeEventListener('change', resolveAccent); observer.disconnect(); detach(); unsubscribe() }
  })
</script>

<div
  bind:this={root}
  data-tint-media-player=""
  data-kind="audio"
  data-size={size}
  data-shadow={shadow ? 'offset' : undefined}
  class={['tint-audio-player', className].filter(Boolean).join(' ')}
>
  <audio bind:this={audio} {src} preload="metadata" aria-label={label}></audio>
  <div data-media-surface-wrap="" class="surface-wrap">
    <div data-media-surface="" class="artwork">
      {#if artwork && !(failedArtwork?.src === src && failedArtwork?.artwork === artwork)}
        <img src={artwork} alt={artworkAlt} onerror={() => failedArtwork = { src, artwork }} />
      {:else}
        <MediaPlaceholder />
      {/if}
    </div>
    <div data-media-bar="" class="bar">
      {#if snapshot.failed && !remote}
        <p role="alert" class="error">This audio could not be played.</p>
      {:else}
        <div data-media-transport="" class="transport">
          {#if onPrevious}
            <button type="button" data-media-previous="" aria-label={`Previous track before ${title ?? label}`} onclick={onPrevious}><Icon icon={SkipBack} size="lg" /></button>
          {/if}
          <button type="button" class="play" aria-label={playing ? `Pause ${title ?? label}` : `Play ${title ?? label}`} onclick={toggle} disabled={snapshot.failed && !remote}>
            {#if snapshot.buffering && !remote}<Spinner size="sm" />{:else}<Icon icon={playing ? Pause : Play} size="sm" />{/if}
          </button>
          {#if onNext}
            <button type="button" data-media-next="" aria-label={`Next track after ${title ?? label}`} onclick={onNext}><Icon icon={SkipForward} size="lg" /></button>
          {/if}
        </div>
        <span data-media-divider="" class="divider" aria-hidden="true"></span>
        <div data-media-content="" class="content">
          <div class="meta">
            {#if artist}<span data-media-artist="" class="artist">{artist}</span>{/if}
            <span class="title">{title ?? label}</span>
          </div>
          <div class="timeline">
            <span data-media-time="elapsed" class="time">{formatTime(currentTime)}</span>
            <MediaScrubber {progress} onSeek={seek} {waveform} color={accentColor} {label} tone="surface" />
            <span data-media-time="remaining" class="time remaining">{duration > 0 ? `-${formatTime(remaining)}` : '0:00'}</span>
          </div>
        </div>
        <span data-media-divider="" class="divider" aria-hidden="true"></span>
        <div data-media-volume="" class="volume"><VolumeControl {volume} isMuted={muted} onVolumeChange={changeVolume} onToggleMute={toggleMute} tone="surface" /></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .tint-audio-player { width: 100%; max-width: 56rem; }
  .surface-wrap { position: relative; display: flex; min-width: 0; flex-direction: column; gap: .75rem; padding: .75rem; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  .artwork { position: relative; width: 100%; flex: none; overflow: hidden; border-radius: var(--tint-radius-sm); background: var(--tint-surface); }
  .artwork img { width: 100%; height: 100%; object-fit: cover; }
  .bar { display: flex; min-width: 0; align-items: center; gap: 1.25rem; }
  .transport { display: flex; flex: none; align-items: center; gap: .625rem; }
  button { display: inline-grid; width: 2rem; height: 2rem; flex: none; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); cursor: pointer; }
  button:hover { background: var(--tint-accent-soft); color: var(--tint-accent); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  button:disabled { cursor: not-allowed; opacity: .4; }
  .play { width: 2.25rem; height: 2.25rem; border: 1px solid var(--tint-border-strong); background: var(--tint-panel); }
  .play:hover { border-color: var(--tint-ink); background: var(--tint-ink); color: var(--tint-panel); }
  .divider { width: 1px; height: 3rem; flex: none; background: var(--tint-border-strong); }
  .content { display: flex; min-width: 0; flex: 1; flex-direction: column; justify-content: center; gap: .5rem; }
  .meta { display: flex; min-width: 0; align-items: baseline; gap: .5rem; }
  .artist { max-width: 45%; flex: none; overflow: hidden; color: var(--tint-muted); font-size: .625rem; font-weight: 500; letter-spacing: .14em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
  .title { min-width: 0; overflow: hidden; color: var(--tint-ink); font-size: 1rem; font-weight: 500; letter-spacing: -.02em; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .timeline { display: flex; min-width: 0; align-items: center; gap: .75rem; }
  .time { width: 2rem; flex: none; color: var(--tint-muted); font-family: var(--font-mono); font-size: .6875rem; font-variant-numeric: tabular-nums; }
  .remaining { width: 2.5rem; text-align: right; }
  .volume { flex: none; }
  .error { margin: 0; overflow: hidden; color: var(--tint-danger-ink); font-size: var(--tint-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
</style>
