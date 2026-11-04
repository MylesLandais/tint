<script lang="ts">
  import { formatTime } from '../../../core/media/model'
  import { formatDrift, syncBand } from './sync'
  import type { SyncStatusProps } from './types'

  const BAND_LABEL = { locked: 'In sync', correcting: 'Catching up', seeking: 'Out of sync' } as const
  const STATE_LABEL = { idle: 'Idle', stalled: 'Stalled', waiting: 'Waiting for everyone', playing: 'Playing', paused: 'Paused' } as const

  let { desiredMs, observedMs, state, buffering = false, appearance = 'desktop', onResync, class: className }: SyncStatusProps = $props()
  let drift = $derived(observedMs - desiredMs)
  let band = $derived(buffering ? 'correcting' : syncBand(drift))
  let summary = $derived(buffering ? 'Buffering' : BAND_LABEL[band])
</script>

<div data-tint-sync-status="" data-band={band} data-appearance={appearance} class={['sync-status', className].filter(Boolean).join(' ')}>
  <span class="indicator" aria-hidden="true"></span>
  <span class="summary" role="status">{summary}</span>
  <span class="detail">{STATE_LABEL[state]} · session {formatTime(desiredMs / 1000)} · you {formatDrift(drift)}</span>
  {#if onResync && band !== 'locked'}<button type="button" onclick={() => onResync?.()}>Resync</button>{/if}
</div>

<style>
  .sync-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-1) var(--tint-space-3); padding: var(--tint-space-2) var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); color: var(--tint-ink); font-size: var(--tint-font-size-xs); }
  .indicator { width: .5rem; height: .5rem; flex: none; border-radius: var(--tint-radius-sm); background: var(--tint-success); }
  [data-band='correcting'] .indicator { background: var(--tint-warning); }
  [data-band='seeking'] .indicator { background: var(--tint-danger); }
  .summary { font-weight: 600; }
  .detail { color: var(--tint-muted); font-variant-numeric: tabular-nums; }
  button { margin-left: auto; min-height: var(--tint-control-sm); padding: 0 var(--tint-space-2); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); color: var(--tint-ink); font: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  [data-appearance='controller'] { font-size: var(--tint-font-size-sm); }
  [data-appearance='controller'] button { min-height: var(--tint-control-lg); padding: 0 var(--tint-space-4); }
</style>
