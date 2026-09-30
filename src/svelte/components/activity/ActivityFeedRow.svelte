<script lang="ts">
  import { activitySignalTone } from '../../../core/activity'
  import Badge from '../badge/Badge.svelte'
  import Avatar from '../identity/Avatar.svelte'
  import type { ActivityFeedRowProps } from './types'

  let { event, selected = false, onSelect, actions, class: className, ...rest }: ActivityFeedRowProps = $props()

  function selectClick(click: MouseEvent) {
    if (!onSelect) return
    const target = click.target
    const current = click.currentTarget
    if (target instanceof Element && current instanceof Element && target !== current) {
      const control = target.closest('button, a[href], input, select, textarea, [role="button"]')
      if (control && control !== current && current.contains(control)) return
    }
    onSelect(event.id)
  }

</script>

<!-- Pointer selection covers the row; the separate button provides keyboard selection. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article
  {...rest}
  data-tint-activity-row="" data-selected={selected || undefined}
  class={['activity-row', className].filter(Boolean).join(' ')} class:interactive={Boolean(onSelect)}
  onclick={selectClick}
>
  <span class="rank">{event.rank ?? '—'}</span>
  <div class="content">
    {#if event.actor}
      <div class="actor">
        <Avatar identity={event.actor} size="xs" decorative />
        {event.actor.name}
      </div>
    {/if}
    <h3><a href={event.href} onclick={(click) => click.stopPropagation()}>{event.title}</a></h3>
    <p class="meta">{event.actor?.name ?? event.attribution}<span aria-hidden="true"> · </span><time datetime={event.publishedAt}>{new Date(event.publishedAt).toLocaleString()}</time></p>
    <div class="signals">{#each event.signals as signal, index (`${signal}-${index}`)}<Badge tone={activitySignalTone(signal)}>{signal}</Badge>{/each}</div>
  </div>
  <div class="stats">
    {#if onSelect}<button type="button" class="select" aria-pressed={selected} onclick={() => onSelect?.(event.id)}>Select {event.title}</button>{/if}
    <span title="Score">{event.score} pts</span><span title="Comments">{event.commentCount} c</span><span title="Shares">{event.shareCount} s</span>
    {@render actions?.()}
  </div>
</article>

<style>
  .activity-row { display: grid; min-width: 0; grid-template-columns: 2.5rem minmax(0,1fr) auto; align-items: start; gap: var(--tint-space-3); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-3) var(--tint-space-2); }
  .activity-row[data-selected] { background: var(--tint-accent-soft); }
  .activity-row.interactive { cursor: pointer; }
  .activity-row.interactive:hover { background: var(--tint-surface); }
  .select { border: 0; background: none; padding: 0; color: var(--tint-accent); cursor: pointer; font: inherit; text-align: right; }
  .select:focus-visible, a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .rank { padding-top: 0.125rem; color: var(--tint-muted); font-size: var(--tint-font-size-sm); font-weight: 600; font-variant-numeric: tabular-nums; text-align: center; }
  .content { min-width: 0; }
  .actor { display: flex; align-items: center; gap: var(--tint-space-2); margin-bottom: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  h3 { margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; }
  a { color: inherit; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .meta { margin: var(--tint-space-1) 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .signals { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-top: var(--tint-space-2); }
  .stats { display: flex; flex-direction: column; align-items: flex-end; gap: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  @container (max-width: 560px) { .activity-row { grid-template-columns: 1.75rem minmax(0,1fr); gap: var(--tint-space-2); } .stats { grid-column: 2; flex-direction: row; flex-wrap: wrap; align-items: center; } }
</style>
