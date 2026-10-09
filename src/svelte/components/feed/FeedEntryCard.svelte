<script lang="ts">
  import { artifactBadge } from '../../../core/feed'
  import Badge from '../badge/Badge.svelte'
  import type { FeedEntryCardProps } from './types'

  let { entry, sourceLabel, selected = false, onSelect, onAutomate, actions, class: className, ...rest }: FeedEntryCardProps = $props()
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
    <div class="title-row">
      <h3>{#if onSelect}<button type="button" class="select" aria-pressed={selected} onclick={() => onSelect?.(entry.id)}>{entry.title}</button>{:else}{entry.title}{/if}</h3>
      <div class="badges-wrap">
        {#if entry.readState === 'unread'}<span class="read-label">Unread</span>{/if}
        {#if artifact}<Badge tone={artifact.tone}>{artifact.label}</Badge>{/if}
      </div>
    </div>
    {#if sourceLabel}<p class="source">{sourceLabel}<span aria-hidden="true"> · </span><time datetime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleString()}</time></p>{/if}
    <p class="excerpt">{entry.excerpt}</p>
    
    {#if entry.downloadProgress && (entry.artifactStatus === 'downloading' || entry.artifactStatus === 'validating')}
      <div class="progress-container">
        <div class="progress-header">
          <span class="progress-stage">{entry.downloadProgress.stageText ?? (entry.artifactStatus === 'validating' ? 'Verifying integrity...' : 'Downloading...')}</span>
          <span class="progress-percent">{Math.round(entry.downloadProgress.percent)}%</span>
        </div>
        <div class="progress-bar-track" role="progressbar" aria-valuenow={Math.round(entry.downloadProgress.percent)} aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar-fill" style:width="{entry.downloadProgress.percent}%"></div>
        </div>
        {#if entry.downloadProgress.rateBytesPerSec}
          <div class="progress-stats">
            <span>{(entry.downloadProgress.bytesDownloaded / (1024 * 1024)).toFixed(1)} / {entry.downloadProgress.totalBytes ? (entry.downloadProgress.totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : '—'}</span>
            <span>{(entry.downloadProgress.rateBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if entry.tags.length}<div class="tags">{#each entry.tags as tag, index (`${tag}-${index}`)}<Badge tone="neutral">{tag}</Badge>{/each}</div>{/if}
    
    {#if onAutomate}
      <div class="automation-row">
        {#if !entry.artifactStatus || entry.artifactStatus === 'none'}
          <button type="button" class="action-btn" onclick={(e) => { e.stopPropagation(); onAutomate?.(entry.id); }}>
            ⚡ Automate Ingest
          </button>
        {:else if entry.artifactStatus === 'queued'}
          <span class="queue-pill">Queued for unlock</span>
        {:else if entry.artifactStatus === 'unlocking'}
          <span class="queue-pill active">Unlocking (CDP lock())...</span>
        {:else if entry.artifactStatus === 'discovering'}
          <span class="queue-pill active">Discovering links...</span>
        {:else if entry.artifactStatus === 'ready'}
          <span class="queue-pill success">✓ Verified SHA-256</span>
        {:else if entry.artifactStatus === 'failed'}
          <button type="button" class="action-btn retry" onclick={(e) => { e.stopPropagation(); onAutomate?.(entry.id); }}>
            ↻ Retry Ingest
          </button>
        {/if}
      </div>
    {/if}

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
  .badges-wrap { display: flex; align-items: center; gap: var(--tint-space-1); flex-shrink: 0; }
  h3 { min-width: 0; margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; line-height: var(--tint-leading-tight); }
  .read-label { color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-weight: 600; }
  .source, .excerpt { margin: 0; color: var(--tint-muted); }
  .source { font-size: var(--tint-font-size-xs); }
  .excerpt { display: -webkit-box; overflow: hidden; font-size: var(--tint-font-size-sm); line-height: var(--tint-leading-normal); line-clamp: 3; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
  .tags { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-top: auto; padding-top: var(--tint-space-1); }
  .actions { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); margin-top: var(--tint-space-2); }
  
  .progress-container { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.4rem 0.5rem; background: var(--tint-surface); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); margin-top: 0.25rem; }
  .progress-header { display: flex; justify-content: space-between; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  .progress-percent { font-weight: 600; color: var(--tint-accent); font-variant-numeric: tabular-nums; }
  .progress-bar-track { height: 0.375rem; width: 100%; background: var(--tint-panel); border-radius: 9999px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: var(--tint-accent); transition: width 0.2s ease; }
  .progress-stats { display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--tint-muted); font-variant-numeric: tabular-nums; }

  .automation-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
  .action-btn { display: inline-flex; align-items: center; gap: 0.25rem; font-size: var(--tint-font-size-xs); padding: 0.2rem 0.5rem; border-radius: var(--tint-radius-sm); border: 1px solid var(--tint-accent); background: var(--tint-accent-soft); color: var(--tint-ink); cursor: pointer; font-weight: 500; transition: background 0.15s; }
  .action-btn:hover { background: color-mix(in srgb, var(--tint-accent) 25%, transparent); }
  .action-btn.retry { border-color: var(--tint-warning); background: var(--tint-warning-soft); color: var(--tint-warning-ink); }
  .queue-pill { font-size: var(--tint-font-size-xs); color: var(--tint-muted); font-weight: 500; }
  .queue-pill.active { color: var(--tint-accent); animation: pulse 2s infinite; }
  .queue-pill.success { color: var(--tint-success-ink); }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @media (prefers-reduced-motion: reduce) { .feed-card { transition: none; } .progress-bar-fill { transition: none; } .queue-pill.active { animation: none; } }
</style>
