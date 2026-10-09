<script lang="ts">
  import type { AutomationQueuePanelProps } from './types'
  import Badge from '../badge/Badge.svelte'
  import { artifactBadge } from '../../../core/feed'

  let {
    items = [],
    activeId = null,
    onSelect,
    onCancel,
    onRetry,
    onTrigger,
    class: className,
    ...rest
  }: AutomationQueuePanelProps = $props()

  type Filter = 'all' | 'active' | 'queued' | 'completed'
  let filter = $state<Filter>('all')

  const counts = $derived.by(() => {
    let active = 0, queued = 0, completed = 0, failed = 0
    for (const item of items) {
      if (item.status === 'downloading' || item.status === 'validating' || item.status === 'unlocking' || item.status === 'discovering') active++
      else if (item.status === 'queued') queued++
      else if (item.status === 'ready') completed++
      else if (item.status === 'failed') failed++
    }
    return { active, queued, completed, failed, total: items.length }
  })

  const filteredItems = $derived.by(() => {
    if (filter === 'active') {
      return items.filter((i) => i.status === 'downloading' || i.status === 'validating' || i.status === 'unlocking' || i.status === 'discovering')
    }
    if (filter === 'queued') return items.filter((i) => i.status === 'queued')
    if (filter === 'completed') return items.filter((i) => i.status === 'ready' || i.status === 'failed')
    return items
  })
</script>

<div {...rest} data-tint-automation-queue="" class={['automation-queue-panel', className].filter(Boolean).join(' ')}>
  <div class="panel-header">
    <div class="header-main">
      <div class="title-wrap">
        <h2>Automation &amp; Download Queue</h2>
        <span class="count-pill">{counts.total} items</span>
      </div>
      <div class="metrics-row">
        <span class="metric"><strong>{counts.active}</strong> active</span>
        <span class="metric"><strong>{counts.queued}</strong> queued</span>
        <span class="metric success"><strong>{counts.completed}</strong> verified</span>
        {#if counts.failed > 0}
          <span class="metric danger"><strong>{counts.failed}</strong> failed</span>
        {/if}
      </div>
    </div>

    <div class="filter-tabs" role="tablist" aria-label="Queue filter">
      <button type="button" role="tab" aria-selected={filter === 'all'} class:active={filter === 'all'} onclick={() => filter = 'all'}>
        All ({counts.total})
      </button>
      <button type="button" role="tab" aria-selected={filter === 'active'} class:active={filter === 'active'} onclick={() => filter = 'active'}>
        Active ({counts.active})
      </button>
      <button type="button" role="tab" aria-selected={filter === 'queued'} class:active={filter === 'queued'} onclick={() => filter = 'queued'}>
        Queued ({counts.queued})
      </button>
      <button type="button" role="tab" aria-selected={filter === 'completed'} class:active={filter === 'completed'} onclick={() => filter = 'completed'}>
        Verified ({counts.completed})
      </button>
    </div>
  </div>

  <div class="queue-body">
    {#if filteredItems.length === 0}
      <div class="queue-empty">
        <p>No queue items in this view.</p>
        <span class="empty-sub">Send articles through automation from the feed or reader pane to initiate background processing.</span>
      </div>
    {:else}
      <div class="queue-list">
        {#each filteredItems as item (item.id)}
          {@const badge = artifactBadge(item.status)}
          <div
            class="queue-item"
            class:selected={activeId === item.entryId}
            data-status={item.status}
          >
            <div class="item-head">
              <div class="item-info">
                {#if onSelect}
                  <button type="button" class="item-title-btn" onclick={() => onSelect?.(item.entryId)}>
                    {item.title}
                  </button>
                {:else}
                  <span class="item-title">{item.title}</span>
                {/if}
                <span class="item-time">{item.createdAt}</span>
              </div>
              <div class="item-status">
                {#if badge}<Badge tone={badge.tone}>{badge.label}</Badge>{/if}
              </div>
            </div>

            <div class="pipeline-flow">
              <span class="step-desc">{item.stageText}</span>
            </div>

            {#if item.progress && (item.status === 'downloading' || item.status === 'validating')}
              <div class="item-progress">
                <div class="progress-track" role="progressbar" aria-valuenow={Math.round(item.progress.percent)} aria-valuemin="0" aria-valuemax="100">
                  <div class="progress-fill" style:width="{item.progress.percent}%"></div>
                </div>
                <div class="progress-meta">
                  <span>{(item.progress.bytesDownloaded / (1024 * 1024)).toFixed(1)} MB / {item.progress.totalBytes ? (item.progress.totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : '—'}</span>
                  <span>{Math.round(item.progress.percent)}%</span>
                  {#if item.progress.rateBytesPerSec}
                    <span>{(item.progress.rateBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s</span>
                  {/if}
                  {#if item.progress.etaSeconds != null}
                    <span>ETA: {item.progress.etaSeconds}s</span>
                  {/if}
                </div>
              </div>
            {/if}

            {#if item.error}
              <div class="item-error">
                <span>Error: {item.error}</span>
              </div>
            {/if}

            <div class="item-actions">
              {#if onSelect}
                <button type="button" class="btn-sub" onclick={() => onSelect?.(item.entryId)}>
                  View in Reader
                </button>
              {/if}
              {#if item.status === 'failed' && onRetry}
                <button type="button" class="btn-sub warning" onclick={() => onRetry?.(item.id)}>
                  ↻ Retry
                </button>
              {/if}
              {#if (item.status === 'queued' || item.status === 'downloading') && onCancel}
                <button type="button" class="btn-sub danger" onclick={() => onCancel?.(item.id)}>
                  ✕ Cancel
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .automation-queue-panel { display: flex; flex-direction: column; height: 100%; min-height: 0; min-width: 0; overflow: hidden; background: var(--tint-panel); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  .panel-header { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); }
  .header-main { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .title-wrap { display: flex; align-items: center; gap: 0.5rem; }
  h2 { margin: 0; font-size: var(--tint-font-size-md); font-weight: 600; color: var(--tint-ink); }
  .count-pill { font-size: 0.6875rem; padding: 0.15rem 0.45rem; border-radius: 9999px; background: var(--tint-panel); color: var(--tint-muted); border: 1px solid var(--tint-border); }
  
  .metrics-row { display: flex; align-items: center; gap: 0.75rem; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  .metric strong { color: var(--tint-ink); font-variant-numeric: tabular-nums; }
  .metric.success strong { color: var(--tint-success-ink); }
  .metric.danger strong { color: var(--tint-danger-ink); }

  .filter-tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--tint-border); margin: 0 -1rem -1rem; padding: 0 1rem; }
  .filter-tabs button { padding: 0.4rem 0.65rem; border: 0; background: none; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }
  .filter-tabs button:hover { color: var(--tint-ink); }
  .filter-tabs button.active { color: var(--tint-accent); border-bottom-color: var(--tint-accent); }

  .queue-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0.75rem; }
  .queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .empty-sub { font-size: var(--tint-font-size-xs); color: var(--tint-muted); opacity: 0.8; margin-top: 0.25rem; }

  .queue-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .queue-item { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; background: var(--tint-surface); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); transition: border-color 0.15s; }
  .queue-item.selected { border-color: var(--tint-accent); box-shadow: 0 0 0 1px var(--tint-accent); }
  .queue-item[data-status='ready'] { border-left: 3px solid var(--tint-success); }
  .queue-item[data-status='downloading'], .queue-item[data-status='validating'] { border-left: 3px solid var(--tint-accent); }
  .queue-item[data-status='unlocking'], .queue-item[data-status='discovering'] { border-left: 3px solid var(--tint-warning); }
  .queue-item[data-status='failed'] { border-left: 3px solid var(--tint-danger); }

  .item-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
  .item-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .item-title-btn { border: 0; background: none; padding: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; text-align: left; cursor: pointer; }
  .item-title-btn:hover { color: var(--tint-accent); }
  .item-title { font-size: var(--tint-font-size-sm); font-weight: 600; color: var(--tint-ink); }
  .item-time { font-size: 0.6875rem; color: var(--tint-muted); }

  .pipeline-flow { font-size: var(--tint-font-size-xs); color: var(--tint-muted); line-height: 1.4; }
  .step-desc { font-weight: 500; color: var(--tint-ink); }

  .item-progress { display: flex; flex-direction: column; gap: 0.25rem; }
  .progress-track { width: 100%; height: 0.375rem; background: var(--tint-panel); border-radius: 9999px; overflow: hidden; border: 1px solid var(--tint-border); }
  .progress-fill { height: 100%; background: var(--tint-accent); transition: width 0.2s ease; }
  .progress-meta { display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--tint-muted); font-variant-numeric: tabular-nums; }

  .item-error { font-size: var(--tint-font-size-xs); color: var(--tint-danger-ink); background: var(--tint-danger-soft); padding: 0.25rem 0.5rem; border-radius: var(--tint-radius-sm); }

  .item-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
  .btn-sub { font-size: 0.6875rem; padding: 0.15rem 0.5rem; border-radius: var(--tint-radius-sm); border: 1px solid var(--tint-border); background: var(--tint-panel); color: var(--tint-muted); cursor: pointer; transition: all 0.15s; }
  .btn-sub:hover { color: var(--tint-ink); border-color: var(--tint-ink); }
  .btn-sub.warning { border-color: var(--tint-warning); color: var(--tint-warning-ink); background: var(--tint-warning-soft); }
  .btn-sub.danger { border-color: var(--tint-danger); color: var(--tint-danger-ink); }
</style>
