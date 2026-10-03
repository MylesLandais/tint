<script lang="ts">
  import {
    MediaPlayer, PlaybackQueue, SettingsPopout,
    type PlaybackQueueItem, type SettingsPopoutItem,
  } from '../svelte/components/media'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const queue: PlaybackQueueItem[] = [
    { id: 'avery', title: 'Avery', subtitle: 'Demo audio', durationSeconds: 23 },
    { id: 'night', title: 'Night Drive', subtitle: 'Demo audio', durationSeconds: 23 },
  ]
  const settings: SettingsPopoutItem[] = [
    { id: 'normal', label: 'Normal', group: 'Playback speed' },
    { id: 'fast', label: 'Fast', group: 'Playback speed' },
  ]
  const waveform = [0.12, 0.4, 0.25, 0.7, 0.45, 0.8, 0.32, 0.56, 0.94, 0.63, 0.4, 0.72, 0.25, 0.51, 0.82, 0.35]
  let kind = $state<'audio' | 'video'>('audio')
  let currentId = $state('avery')
  let playerTitle = $derived(queue.find((item) => item.id === currentId)?.title ?? 'Avery')
  let settingsOpen = $state(false)
  let speed = $state('normal')
  const api: ApiRow[] = [
    { prop: 'MediaPlayer.kind', type: 'audio | video', description: 'One entry point for audio and video presentation.' },
    { prop: 'src / label / title', type: 'string', description: 'Media URL, accessible transport name, and optional visible title.' },
    { prop: 'remote', type: 'RemoteMediaController', description: 'Optional host-owned playback, position, duration, and volume for audio.' },
    { prop: 'waveform / duration', type: 'readonly number[] / number', description: 'Optional normalized waveform and duration hint.' },
    { prop: 'tracks', type: 'MediaTextTrack[]', description: 'Caption, subtitle, or description tracks for video; each supplies a URL, language, and label.' },
    { prop: 'onPlay / onPause / onPrevious / onNext', type: '() => void', description: 'Intent callbacks for playback and queue navigation.' },
    { prop: 'shadow / size / class', type: 'boolean / MediaSize / string', description: 'Optional offset shadow, constrained player width, and host class. PlaybackQueue and SettingsPopout also accept a host class.' },
    { prop: 'artist / artwork / artworkAlt', type: 'string', description: 'Audio-only artist text and optional cover image with its alternative text.' },
    { prop: 'playing / playbackNonce / onEnded', type: 'boolean / number / () => void', description: 'Audio playback override, host restart signal, and end-of-track notification.' },
    { prop: 'poster / playbackSpeeds / autoHideControls', type: 'string / readonly number[] / boolean', description: 'Video poster, available speed choices, and whether chrome hides when the pointer and focus leave the player.' },
    { prop: 'PlaybackQueue.items / currentItemId / onSelect', type: 'PlaybackQueueItem[] / string / (item, index) => void', description: 'Controlled queue position and activation.' },
    { prop: 'PlaybackQueue.status / positionSeconds / emptyLabel', type: 'PlaybackQueueStatus / number / string', description: 'Transport state, elapsed seconds for the current item, and the message shown for an empty queue.' },
    { prop: 'SettingsPopout.isOpen / value / onSelect', type: 'boolean / string / (id) => void', description: 'Controlled searchable setting choice.' },
    { prop: 'SettingsPopout.onOpenChange / onQueryChange', type: '(open) => void / (query) => void', description: 'Open-state intent and optional search-query updates; the host owns whether settings remain open.' },
    { prop: 'SettingsPopout.placeholder / emptySearchText / footer / trigger', type: 'string / string | Snippet / string | Snippet / Snippet', description: 'Search hint, no-match content, optional footer, and custom trigger using the provided popover trigger props.' },
  ]
  const usage = `import { MediaPlayer, PlaybackQueue } from '@nebula/tint/media'

let currentId = $state('track-1')

<MediaPlayer kind="audio" src="/audio/track.wav" label="Track"
  title="Track" duration={180} waveform={peaks} />
<PlaybackQueue items={queue} {currentItemId}
  onSelect={(item) => currentId = item.id} />

<MediaPlayer kind="video" src="/video/clip.mp4" label="Clip"
  tracks={[{ src: '/video/clip.en.vtt', kind: 'captions', srcLang: 'en', label: 'English captions', default: true }]} />`
</script>

<DocPage title="Media" description="A unified audio and video player with native media transport, keyboard seek and volume controls, a controlled queue, and searchable settings." importPath="@nebula/tint/media-player" {usage} {api} accessibility="Play, pause, seek, volume, and settings are named controls with keyboard support. Supply caption or subtitle tracks for videos with audio; the live sample clip is silent. The queue marks its current item and keeps selection host-owned. Progress and time remain visible as text; reduced motion settings remove decorative transitions.">
  <div class="media-demo">
    <div role="group" aria-label="Media kind" class="switcher">
      <button type="button" aria-pressed={kind === 'audio'} onclick={() => kind = 'audio'}>Audio</button>
      <button type="button" aria-pressed={kind === 'video'} onclick={() => kind = 'video'}>Video</button>
    </div>
    {#if kind === 'audio'}
      <MediaPlayer kind="audio" src="/audio/avery.wav" label={playerTitle} title={playerTitle} artist="Tint demo" duration={23} {waveform} />
    {:else}
      <MediaPlayer kind="video" src="/videos/big-buck-bunny.mp4" label="Demo video" title="Big Buck Bunny" autoHideControls={false} />
    {/if}
    <div class="below">
      <PlaybackQueue items={queue} currentItemId={currentId} status="paused" onSelect={(item) => currentId = item.id} />
      <div class="settings">
        <SettingsPopout isOpen={settingsOpen} onOpenChange={(next) => settingsOpen = next} items={settings} value={speed} onSelect={(id) => speed = id} label="Playback settings" />
        <span aria-live="polite">Speed: {speed}</span>
      </div>
    </div>
  </div>
</DocPage>

<style>
  .media-demo { display: grid; gap: 1rem; }
  .switcher { display: flex; gap: .5rem; }
  .switcher button { min-height: 2.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .35rem .75rem; background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; font: inherit; }
  .switcher button[aria-pressed='true'] { background: var(--tint-accent); color: var(--tint-on-accent); }
  .switcher button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .below { display: grid; grid-template-columns: minmax(0, 1fr) minmax(10rem, .6fr); gap: 1rem; }
  .settings { display: flex; flex-direction: column; align-items: flex-start; gap: .75rem; color: var(--tint-muted); font-size: .84rem; }
  @container (max-width: 660px) { .below { grid-template-columns: 1fr; } }
</style>
