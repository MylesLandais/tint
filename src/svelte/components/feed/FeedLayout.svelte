<script lang="ts">
  import type { FeedEntry } from '../../../core/feed'
  import FeedEntryView from './FeedEntryView.svelte'
  import type { FeedLayoutProps } from './types'

  let {
    entries, variant = 'feed', sourceLabels, selectedId = null, onSelect,
    renderActions, empty, class: className, ...rest
  }: FeedLayoutProps = $props()

  function sourceLabel(entry: FeedEntry): string | undefined {
    return sourceLabels?.[entry.sourceId]
  }
</script>

<div {...rest} data-tint-feed-layout="" data-variant={variant} class={['feed-layout', className].filter(Boolean).join(' ')}>
  {#if entries.length === 0}
    <div class="empty">{#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{:else}No entries.{/if}</div>
  {:else}
    <div class="feed-items" data-mode={variant}>
      {#if variant === 'list' || variant === 'ticker'}
        {#each entries as entry (entry.id)}
          <FeedEntryView {entry} kind="row" sourceLabel={sourceLabel(entry)} selected={selectedId === entry.id} {onSelect} {renderActions} />
        {/each}
      {:else if variant === 'magazine'}
        {@const hero = entries[0]}
        {#if hero}<div class="hero"><FeedEntryView entry={hero} kind="card" sourceLabel={sourceLabel(hero)} selected={selectedId === hero.id} {onSelect} {renderActions} /></div>{/if}
        <div class="magazine-rest">
          {#each entries.slice(1) as entry (entry.id)}
            <FeedEntryView {entry} kind="row" sourceLabel={sourceLabel(entry)} selected={selectedId === entry.id} {onSelect} {renderActions} />
          {/each}
        </div>
      {:else}
        {#each entries as entry (entry.id)}
          <FeedEntryView {entry} kind="card" sourceLabel={sourceLabel(entry)} selected={selectedId === entry.id} {onSelect} {renderActions} />
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .feed-layout { container-type: inline-size; min-width: 0; }
  .empty { color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .feed-items { min-width: 0; }
  .feed-items[data-mode='feed'] { display: flex; flex-direction: column; gap: var(--tint-space-3); }
  .feed-items[data-mode='list'] { overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); }
  .feed-items[data-mode='ticker'] { display: flex; overflow-x: auto; border: 1px solid var(--tint-border); }
  .feed-items[data-mode='ticker'] :global([data-tint-feed-entry]) { width: 18rem; min-width: 18rem; flex: none; border-right: 1px solid var(--tint-border); border-bottom: 0; }
  .feed-items[data-mode='magazine'] { display: grid; gap: var(--tint-space-4); }
  .hero { min-width: 0; min-height: 16rem; }
  .hero :global([data-tint-feed-entry]) { min-height: 16rem; }
  .magazine-rest { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-2); }
  .feed-items[data-mode='carousel'] { display: flex; gap: var(--tint-space-3); overflow-x: auto; padding-bottom: var(--tint-space-1); }
  .feed-items[data-mode='carousel'] :global([data-tint-feed-entry]) { width: 18rem; flex: none; }
  .feed-items[data-mode='wall'] { columns: 1; column-gap: var(--tint-space-3); }
  .feed-items[data-mode='wall'] :global([data-tint-feed-entry]) { break-inside: avoid; margin-bottom: var(--tint-space-3); }
  @container (min-width: 640px) { .feed-items[data-mode='wall'] { columns: 2; } }
  @container (min-width: 800px) { .feed-items[data-mode='magazine'] { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); } }
  @container (min-width: 1100px) { .feed-items[data-mode='wall'] { columns: 3; } }
  @container (max-width: 360px) {
    .feed-items[data-mode='ticker'] :global([data-tint-feed-entry]),
    .feed-items[data-mode='carousel'] :global([data-tint-feed-entry]) { width: 85cqw; min-width: 85cqw; }
  }
</style>
