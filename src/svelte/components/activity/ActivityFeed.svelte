<script lang="ts">
  import { ACTIVITY_SORTS, sortActivityEvents } from '../../../core/activity'
  import ActivityRowView from './ActivityRowView.svelte'
  import type { ActivityFeedProps } from './types'

  let {
    events, sort = 'hot', onSortChange, selectedId = null, onSelect,
    renderActions, empty, now, class: className, ...rest
  }: ActivityFeedProps = $props()
  let ranked = $derived(sortActivityEvents(events, sort, now))
</script>

<div {...rest} data-tint-activity-feed="" class={['activity-feed', className].filter(Boolean).join(' ')}>
  <div role="group" aria-label="Activity sort" class="sort-controls">
    {#each ACTIVITY_SORTS as value (value)}<button type="button" aria-pressed={sort === value} onclick={() => onSortChange?.(value)}>{value}</button>{/each}
  </div>
  {#if ranked.length === 0}
    <p class="empty">{#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{:else}No activity.{/if}</p>
  {:else}
    {#each ranked as event (event.id)}<ActivityRowView {event} selected={selectedId === event.id} {onSelect} {renderActions} />{/each}
  {/if}
</div>

<style>
  .activity-feed { container-type: inline-size; display: flex; min-width: 0; flex-direction: column; }
  .sort-controls { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-bottom: var(--tint-space-2); border-bottom: 1px solid var(--tint-border); padding-bottom: var(--tint-space-2); }
  .sort-controls button { min-height: 2.25rem; border: 1px solid transparent; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  .sort-controls button:hover { background: var(--tint-surface); }
  .sort-controls button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  .sort-controls button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .empty { margin: 0; padding: var(--tint-space-6) var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
