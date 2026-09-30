<script lang="ts">
  import { Pause, Play } from '@lucide/svelte'
  import { formatTime, queueItemStatus, type PlaybackQueueStatus } from '../../../core/media/model'
  import Icon from '../icon/Icon.svelte'
  import QueueArtwork from './QueueArtwork.svelte'
  import type { PlaybackQueueItem } from './types'

  type Props = {
    items: readonly PlaybackQueueItem[]
    currentItemId?: string | null
    status?: PlaybackQueueStatus
    positionSeconds?: number
    label?: string
    emptyLabel?: string
    onSelect?: (item: PlaybackQueueItem, index: number) => void
    class?: string
  }
  let {
    items, currentItemId, status = 'idle', positionSeconds = 0,
    label = 'Playback queue', emptyLabel = 'Nothing is queued.',
    onSelect, class: className,
  }: Props = $props()
  let currentIndex = $derived(items.findIndex((item) => item.id === currentItemId))
</script>

<section data-tint-playback-queue="" aria-label={label} class={['tint-playback-queue', className].filter(Boolean).join(' ')}>
  <header><h3>{label}</h3><span>{items.length} {items.length === 1 ? 'item' : 'items'}</span></header>
  {#if items.length === 0}
    <p class="empty">{emptyLabel}</p>
  {:else}
    <ol>
      {#each items as item, index (item.id)}
        {@const current = item.id === currentItemId}
        {@const stateLabel = queueItemStatus(index, currentIndex, status)}
        <li>
          {#snippet content()}
            <span class="artwork"><QueueArtwork src={item.artwork} />{#if current}<span class="playing-icon"><Icon icon={status === 'playing' ? Pause : Play} size="sm" /></span>{/if}</span>
            <span class="metadata"><span class="title">{item.title}</span><span class="subtitle">{item.subtitle ?? stateLabel}</span></span>
            <span class="status"><span class:current>{stateLabel}</span>{#if item.durationSeconds !== undefined}<span class="duration">{current && positionSeconds > 0 ? `${formatTime(positionSeconds)} / ${formatTime(item.durationSeconds)}` : formatTime(item.durationSeconds)}</span>{/if}</span>
          {/snippet}
          {#if onSelect}
            <button type="button" aria-current={current ? 'true' : undefined} class:current onclick={() => onSelect?.(item, index)}>{@render content()}</button>
          {:else if item.href}
            <a href={item.href} aria-current={current ? 'true' : undefined} class:current>{@render content()}</a>
          {:else}
            <div aria-current={current ? 'true' : undefined} class:current>{@render content()}</div>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .tint-playback-queue { overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .75rem 1rem; border-bottom: 1px solid var(--tint-border); }
  h3 { margin: 0; font-size: var(--tint-font-size-sm); font-weight: 600; }
  header span, .empty { color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  .empty { margin: 0; padding: 1.5rem 1rem; }
  ol { max-height: 32rem; margin: 0; padding: .375rem; overflow: auto; list-style: none; }
  li > :is(button, a, div) { display: flex; width: 100%; align-items: center; gap: .75rem; padding: .5rem .625rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: inherit; font: inherit; text-align: left; text-decoration: none; }
  li > :is(button, a) { cursor: pointer; }
  li > :is(button, a):hover { background: var(--tint-surface); }
  li > :is(button, a):focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  li > .current { background: var(--tint-accent-soft); }
  .artwork { position: relative; display: block; width: 3rem; height: 3rem; flex: none; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); }
  .playing-icon { position: absolute; inset: 0; display: grid; place-items: center; background: color-mix(in srgb, var(--tint-ink) 55%, transparent); color: var(--tint-panel); }
  .metadata { min-width: 0; flex: 1; }
  .title, .subtitle, .status > span { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .title { font-size: var(--tint-font-size-sm); font-weight: 500; }
  .subtitle { margin-top: .125rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .status { flex: none; color: var(--tint-muted); font-size: .6875rem; text-align: right; font-variant-numeric: tabular-nums; }
  .status > span:first-child { font-weight: 500; text-transform: uppercase; }
  .status > span.current { color: var(--tint-accent); }
  .duration { margin-top: .125rem; font-family: var(--font-mono); }
</style>
