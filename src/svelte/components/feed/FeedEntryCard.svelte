<script lang="ts">
  import { artifactBadge } from '../../../core/feed'
  import Badge from '../badge/Badge.svelte'
  import type { FeedEntryCardProps } from './types'

  let { entry, sourceLabel, selected = false, onSelect, actions, class: className, ...rest }: FeedEntryCardProps = $props()
  let artifact = $derived(artifactBadge(entry.artifactStatus))

  function selectClick(event: MouseEvent) {
    if (!onSelect) return
    const target = event.target
    const current = event.currentTarget
    if (target instanceof Element && current instanceof Element && target !== current) {
      const control = target.closest('button, a[href], input, select, textarea, [role="button"]')
      if (control && control !== current && current.contains(control)) return
    }
    onSelect(entry.id)
  }

</script>

<!-- Pointer selection covers the card; the title is a native keyboard selection button. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article
  {...rest}
  data-tint-feed-entry="" data-tint-feed-variant="card"
  data-unread={entry.readState === 'unread' || undefined} data-selected={selected || undefined}
  class={['feed-card', className].filter(Boolean).join(' ')} class:interactive={Boolean(onSelect)}
  onclick={selectClick}
>
  {#if entry.media}
    <div class="media"><img src={entry.media.url} alt="" width={entry.media.width} height={entry.media.height} /></div>
  {/if}
  <div class="body">
    <div class="title-row"><h3>{#if onSelect}<button type="button" class="select" aria-pressed={selected} onclick={() => onSelect?.(entry.id)}>{entry.title}</button>{:else}{entry.title}{/if}</h3>{#if entry.readState === 'unread'}<span class="read-label">Unread</span>{/if}{#if artifact}<Badge tone={artifact.tone}>{artifact.label}</Badge>{/if}</div>
    {#if sourceLabel}<p class="source">{sourceLabel}<span aria-hidden="true"> · </span><time datetime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleString()}</time></p>{/if}
    <p class="excerpt">{entry.excerpt}</p>
    {#if entry.tags.length}<div class="tags">{#each entry.tags as tag, index (`${tag}-${index}`)}<Badge tone="neutral">{tag}</Badge>{/each}</div>{/if}
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
</article>

<style>
  .feed-card { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); text-align: left; box-shadow: 0 1px 2px var(--tint-shadow-color); transition: background-color var(--tint-motion-base) var(--tint-ease); }
  .feed-card[data-unread] { border-left: 2px solid var(--tint-accent); }
  .feed-card[data-selected] { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  .feed-card.interactive { cursor: pointer; }
  .feed-card.interactive:hover { background: var(--tint-surface); }
  .select { border: 0; background: none; padding: 0; color: inherit; cursor: pointer; font: inherit; text-align: inherit; }
  .select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .media { aspect-ratio: 16 / 9; width: 100%; overflow: hidden; background: var(--tint-surface); }
  .media img { width: 100%; height: 100%; object-fit: cover; }
  .body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: var(--tint-space-2); padding: var(--tint-space-3); }
  .title-row { display: flex; min-width: 0; align-items: flex-start; justify-content: space-between; gap: var(--tint-space-2); }
  h3 { min-width: 0; margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; line-height: var(--tint-leading-tight); }
  .read-label { color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-weight: 600; }
  .source, .excerpt { margin: 0; color: var(--tint-muted); }
  .source { font-size: var(--tint-font-size-xs); }
  .excerpt { display: -webkit-box; overflow: hidden; font-size: var(--tint-font-size-sm); line-height: var(--tint-leading-normal); line-clamp: 3; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
  .tags { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-top: auto; padding-top: var(--tint-space-1); }
  .actions { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-top: var(--tint-space-2); }
  @media (prefers-reduced-motion: reduce) { .feed-card { transition: none; } }
</style>
