<script lang="ts">
  import { Lock, ThumbsDown, ThumbsUp } from '@lucide/svelte'
  import { formatTime } from '../../../core/media/model'
  import Icon from '../icon/Icon.svelte'
  import QueueArtwork from '../media/QueueArtwork.svelte'
  import type { RequestQueueProps, SessionRequestView } from './types'

  let {
    requests, label = 'Requests', emptyLabel = 'No requests yet. Add something to watch.',
    appearance = 'desktop', onVote, footer, class: className,
  }: RequestQueueProps = $props()

  function title(request: SessionRequestView): string {
    return request.redacted ? 'Private request' : request.title
  }
</script>

<section data-tint-request-queue="" data-appearance={appearance} aria-label={label} class={['request-queue', className].filter(Boolean).join(' ')}>
  <header><h3>{label}</h3><span>{requests.length} queued</span></header>
  {#if requests.length === 0}
    <p class="empty">{emptyLabel}</p>
  {:else}
    <ol>
      {#each requests as request, index (request.id)}
        <li aria-current={request.current ? 'true' : undefined} data-redacted={request.redacted || undefined}>
          <span class="position" aria-hidden="true">{request.current ? '▶' : index + 1}</span>
          <span class="artwork">
            {#if request.redacted}<span class="locked"><Icon icon={Lock} size="sm" /></span>{:else}<QueueArtwork src={request.artwork} />{/if}
          </span>
          <span class="metadata">
            <span class="title">{title(request)}</span>
            <span class="subtitle">
              {#if request.current}Now playing · {/if}Requested by {request.requestedBy}
              {#if !request.redacted && request.durationMs !== undefined} · <span class="duration">{formatTime(request.durationMs / 1000)}</span>{/if}
            </span>
          </span>
          {#if request.score !== undefined}<span class="votes" role="group" aria-label={`Votes for ${title(request)}`}>
            {#if onVote}
              <button type="button" aria-pressed={request.myVote === 1} aria-label="Vote up" onclick={() => onVote?.(request, 1)}><Icon icon={ThumbsUp} size="sm" /></button>
            {/if}
            <span class="score" aria-label={`Score ${request.score}`}>{request.score > 0 ? `+${request.score}` : request.score}</span>
            {#if onVote}
              <button type="button" aria-pressed={request.myVote === -1} aria-label="Vote down" onclick={() => onVote?.(request, -1)}><Icon icon={ThumbsDown} size="sm" /></button>
            {/if}
          </span>{/if}
        </li>
      {/each}
    </ol>
  {/if}
  {#if footer}<footer>{@render footer()}</footer>{/if}
</section>

<style>
  .request-queue { display: flex; min-height: 0; flex-direction: column; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  header { display: flex; align-items: baseline; justify-content: space-between; padding: var(--tint-space-3) var(--tint-space-4); border-bottom: 1px solid var(--tint-border); }
  h3 { margin: 0; font-size: var(--tint-font-size-sm); font-weight: 600; }
  header span, .empty { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .empty { margin: 0; padding: var(--tint-space-5) var(--tint-space-4); }
  ol { min-height: 0; flex: 1; margin: 0; padding: var(--tint-space-2); overflow: auto; list-style: none; }
  li { display: flex; align-items: center; gap: var(--tint-space-3); padding: var(--tint-space-2); border-radius: var(--tint-radius-sm); }
  li[aria-current='true'] { background: var(--tint-accent-soft); }
  .position { width: 1.25rem; flex: none; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; text-align: center; }
  li[aria-current='true'] .position { color: var(--tint-accent); }
  .artwork { display: block; width: 2.5rem; height: 2.5rem; flex: none; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); }
  .artwork :global(img) { width: 100%; height: 100%; object-fit: cover; }
  .locked { display: grid; width: 100%; height: 100%; place-items: center; color: var(--tint-muted); }
  .metadata { display: grid; min-width: 0; flex: 1; }
  .title, .subtitle { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .title { font-size: var(--tint-font-size-sm); font-weight: 500; }
  li[data-redacted] .title { color: var(--tint-muted); font-style: italic; }
  .subtitle { margin-top: .125rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .duration { font-family: var(--font-mono); }
  .votes { display: flex; flex: none; align-items: center; gap: var(--tint-space-1); }
  .score { min-width: 1.75rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; text-align: center; }
  button { display: inline-grid; width: var(--tint-control-sm); height: var(--tint-control-sm); place-items: center; border: 1px solid transparent; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-muted); cursor: pointer; }
  button:hover { border-color: var(--tint-border); color: var(--tint-ink); }
  button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent-soft); color: var(--tint-accent); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  footer { padding: var(--tint-space-3); border-top: 1px solid var(--tint-border); }
  [data-appearance='controller'] li { padding: var(--tint-space-3); }
  [data-appearance='controller'] .artwork { width: 3.5rem; height: 3.5rem; }
  [data-appearance='controller'] .title { font-size: var(--tint-font-size-md); }
  [data-appearance='controller'] button { width: var(--tint-control-lg); height: var(--tint-control-lg); }
  [data-appearance='controller'] button:focus-visible { outline-width: 3px; outline-offset: 3px; }
</style>
