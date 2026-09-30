<script lang="ts">
  import { artifactBadge } from '../../../core/feed'
  import Badge from '../badge/Badge.svelte'
  import type { FeedEntryRowProps } from './types'

  let { entry, sourceLabel, selected = false, onSelect, actions, class: className, ...rest }: FeedEntryRowProps = $props()
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

<!-- Pointer selection covers the row; the title is a native keyboard selection button. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article
  {...rest}
  data-tint-feed-entry="" data-tint-feed-variant="row"
  data-unread={entry.readState === 'unread' || undefined} data-selected={selected || undefined}
  class={['feed-row', className].filter(Boolean).join(' ')} class:interactive={Boolean(onSelect)}
  onclick={selectClick}
>
  <span class="unread-dot" aria-hidden="true"></span>
  <div class="content">
    <div class="title-row"><h3>{#if onSelect}<button type="button" class="select" aria-pressed={selected} onclick={() => onSelect?.(entry.id)}>{entry.title}</button>{:else}{entry.title}{/if}</h3>{#if entry.readState === 'unread'}<span class="read-label">Unread</span>{/if}{#if artifact}<Badge tone={artifact.tone}>{artifact.label}</Badge>{/if}</div>
    <p class="meta">{#if sourceLabel}{sourceLabel}<span aria-hidden="true"> · </span>{/if}<time datetime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleString()}</time><span aria-hidden="true"> · </span>{entry.excerpt}</p>
  </div>
  {#if actions}<div class="actions">{@render actions()}</div>{/if}
</article>

<style>
  .feed-row { display: flex; min-width: 0; align-items: flex-start; gap: var(--tint-space-3); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2); text-align: left; }
  .feed-row:last-child { border-bottom: 0; }
  .feed-row[data-unread] { background: var(--tint-accent-soft); }
  .feed-row[data-selected] { box-shadow: inset 0 0 0 1px var(--tint-accent); }
  .feed-row.interactive { cursor: pointer; }
  .feed-row.interactive:hover { background: var(--tint-surface); }
  .select { border: 0; background: none; padding: 0; color: inherit; cursor: pointer; font: inherit; text-align: inherit; }
  .select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .unread-dot { width: 0.375rem; height: 0.375rem; flex: none; margin-top: 0.375rem; border-radius: 50%; }
  .feed-row[data-unread] .unread-dot { background: var(--tint-accent); }
  .content { min-width: 0; flex: 1; }
  .title-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tint-space-2); }
  h3 { min-width: 0; margin: 0; overflow: hidden; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
  .read-label { color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-weight: 600; }
  .meta { margin: 0.125rem 0 0; overflow: hidden; color: var(--tint-muted); font-size: var(--tint-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
  .actions { display: flex; flex: none; align-items: center; gap: var(--tint-space-1); }
</style>
