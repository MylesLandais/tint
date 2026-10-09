<script lang="ts">
  import type { ReaderPaneProps } from './types'
  import Badge from '../badge/Badge.svelte'
  import { artifactBadge } from '../../../core/feed'

  let {
    header,
    highlightLayer,
    automationBar,
    entry,
    onAutomate,
    children,
    class: className,
    ...rest
  }: ReaderPaneProps = $props()

  let artifact = $derived(entry ? artifactBadge(entry.artifactStatus) : null)
</script>

<article {...rest} data-tint-reader-pane="" class={['reader-pane', className].filter(Boolean).join(' ')}>
  {#if header}<header data-tint-reader-header="">{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}</header>{/if}
  
  {#if automationBar}
    <div data-tint-reader-automation="" class="automation-section">
      {@render automationBar()}
    </div>
  {:else if entry}
    <div data-tint-reader-automation="" class="automation-bar" data-status={entry.artifactStatus ?? 'none'}>
      <div class="automation-header">
        <div class="automation-title">
          <span class="automation-badge">Automation Pipeline</span>
          {#if artifact}<Badge tone={artifact.tone}>{artifact.label}</Badge>{/if}
        </div>
        {#if onAutomate}
          {#if !entry.artifactStatus || entry.artifactStatus === 'none'}
            <button type="button" class="btn-automate" onclick={() => onAutomate?.(entry.id)}>
              ⚡ Send through Automation
            </button>
          {:else if entry.artifactStatus === 'failed'}
            <button type="button" class="btn-automate retry" onclick={() => onAutomate?.(entry.id)}>
              ↻ Retry Ingest
            </button>
          {/if}
        {/if}
      </div>

      {#if entry.artifactStatus === 'unlocking'}
        <div class="automation-detail status-pulse">
          <span class="dot-indicator warning"></span>
          <span>CDP Unlock in progress: Evaluating <code>window.lock()</code> &amp; inspecting challenge response...</span>
        </div>
      {:else if entry.artifactStatus === 'discovering'}
        <div class="automation-detail status-pulse">
          <span class="dot-indicator warning"></span>
          <span>Depth discovering links: Resolving target file-host endpoints...</span>
        </div>
      {:else if entry.artifactStatus === 'queued'}
        <div class="automation-detail">
          <span class="dot-indicator"></span>
          <span>Queued for worker execution...</span>
        </div>
      {:else if entry.artifactStatus === 'downloading' || entry.artifactStatus === 'validating'}
        <div class="automation-download">
          <div class="progress-labels">
            <span class="stage-label">
              {entry.artifactStatus === 'validating' ? 'Integrity Validation: Running ffprobe stream inspection & SHA-256 calculation...' : (entry.downloadProgress?.stageText ?? 'Downloading payload stream...')}
            </span>
            {#if entry.downloadProgress}
              <span class="percent-label">{Math.round(entry.downloadProgress.percent)}%</span>
            {/if}
          </div>
          {#if entry.downloadProgress}
            <div class="download-track" role="progressbar" aria-valuenow={Math.round(entry.downloadProgress.percent)} aria-valuemin="0" aria-valuemax="100">
              <div class="download-fill" style:width="{entry.downloadProgress.percent}%"></div>
            </div>
            <div class="download-meta">
              <span>{(entry.downloadProgress.bytesDownloaded / (1024 * 1024)).toFixed(1)} MB / {entry.downloadProgress.totalBytes ? (entry.downloadProgress.totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : '—'}</span>
              {#if entry.downloadProgress.rateBytesPerSec}
                <span>{(entry.downloadProgress.rateBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s</span>
              {/if}
              {#if entry.downloadProgress.etaSeconds != null}
                <span>ETA: {entry.downloadProgress.etaSeconds}s</span>
              {/if}
            </div>
          {/if}
        </div>
      {:else if entry.artifactStatus === 'ready'}
        <div class="automation-detail success">
          <span class="dot-indicator success"></span>
          <span>File download complete · Verified playable via ffprobe · SHA-256 checksum matched · Uploaded to SeaweedFS</span>
        </div>
      {:else if entry.artifactStatus === 'failed'}
        <div class="automation-detail error">
          <span class="dot-indicator danger"></span>
          <span>Automation error: {entry.downloadProgress?.error ?? 'Pipeline execution interrupted'}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div data-tint-reader-scroll="" class="scroll">
    {@render highlightLayer?.()}
    <div data-tint-reader-body="" class="body">{@render children()}</div>
  </div>
</article>

<style>
  .reader-pane { position: relative; display: flex; height: 100%; min-height: 0; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  header { position: sticky; top: 0; z-index: 10; flex: none; border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); padding: var(--tint-space-3) var(--tint-space-4); }
  
  .automation-section { flex: none; border-bottom: 1px solid var(--tint-border); }
  .automation-bar { flex: none; display: flex; flex-direction: column; gap: 0.5rem; padding: 0.625rem 1rem; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); font-size: var(--tint-font-size-xs); }
  .automation-bar[data-status='ready'] { background: color-mix(in srgb, var(--tint-success) 8%, var(--tint-surface)); border-bottom-color: color-mix(in srgb, var(--tint-success) 30%, transparent); }
  .automation-bar[data-status='failed'] { background: color-mix(in srgb, var(--tint-danger) 8%, var(--tint-surface)); }
  .automation-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .automation-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--tint-ink); }
  .automation-badge { text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.6875rem; color: var(--tint-muted); }
  
  .btn-automate { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.625rem; font-size: var(--tint-font-size-xs); font-weight: 500; border-radius: var(--tint-radius-sm); border: 1px solid var(--tint-accent); background: var(--tint-accent); color: var(--tint-ink); cursor: pointer; transition: opacity 0.15s; }
  .btn-automate:hover { opacity: 0.9; }
  .btn-automate.retry { border-color: var(--tint-warning); background: var(--tint-warning-soft); color: var(--tint-warning-ink); }
  
  .automation-detail { display: flex; align-items: center; gap: 0.5rem; color: var(--tint-muted); line-height: 1.4; }
  .automation-detail.success { color: var(--tint-success-ink); font-weight: 500; }
  .automation-detail.error { color: var(--tint-danger-ink); font-weight: 500; }
  .dot-indicator { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--tint-muted); flex: none; }
  .dot-indicator.warning { background: var(--tint-warning); }
  .dot-indicator.success { background: var(--tint-success); }
  .dot-indicator.danger { background: var(--tint-danger); }
  
  .status-pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

  .automation-download { display: flex; flex-direction: column; gap: 0.35rem; }
  .progress-labels { display: flex; justify-content: space-between; font-weight: 500; color: var(--tint-ink); }
  .percent-label { color: var(--tint-accent); font-variant-numeric: tabular-nums; font-weight: 600; }
  .download-track { width: 100%; height: 0.4rem; background: var(--tint-panel); border-radius: 9999px; overflow: hidden; border: 1px solid var(--tint-border); }
  .download-fill { height: 100%; background: var(--tint-accent); transition: width 0.2s ease; }
  .download-meta { display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--tint-muted); font-variant-numeric: tabular-nums; }

  .scroll { position: relative; min-height: 0; flex: 1; overflow: auto; }
  .body { position: relative; z-index: 0; padding: var(--tint-space-4); color: var(--tint-ink); font-size: var(--tint-font-size-sm); line-height: 1.75; }
  code { font-family: var(--font-mono, monospace); font-size: 0.9em; padding: 0.1rem 0.25rem; background: var(--tint-panel); border-radius: 3px; }
  @media (prefers-reduced-motion: reduce) { .status-pulse { animation: none; } .download-fill { transition: none; } }
</style>
