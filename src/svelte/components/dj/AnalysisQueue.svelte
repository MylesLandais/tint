<script lang="ts">
  import { analysisDuration } from '../../../core/dj/view'
  import type { AnalysisQueueProps } from './types'

  let { items, onRetry, class: className }: AnalysisQueueProps = $props()
  let ready = $derived(items.filter((item) => item.status === 'ready').length)
</script>

<section aria-label="Track analysis queue" class={className}>
  <p role="status" class="text-sm text-tint-muted">{ready} of {items.length} tracks ready</p>
  <ul class="mt-3 space-y-2">
    {#each items as item (item.id)}
      <li class="rounded-md border border-tint-border p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-medium">{item.fileName}</span>
          <span class="text-sm text-tint-muted">
            {#if item.status === 'queued'}Queued
            {:else if item.status === 'decoding'}Decoding
            {:else if item.status === 'ready'}{analysisDuration(item.durationSeconds)}
            {:else}Failed{/if}
          </span>
        </div>
        {#if item.status === 'error'}
          <div class="mt-2 flex items-center justify-between gap-2">
            <span role="alert" class="text-sm text-tint-danger">{item.error ?? 'Track analysis failed'}</span>
            <button type="button" class="rounded-md border border-tint-border px-2 py-1 text-sm" onclick={() => onRetry(item.id)}>Retry {item.fileName}</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>
