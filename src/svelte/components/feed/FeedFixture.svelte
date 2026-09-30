<script lang="ts">
  import type { FeedEntry, FeedLayoutVariant } from '../../../core/feed'
  import FeedLayout from './FeedLayout.svelte'

  let {
    entries, variant = 'feed', selectedId = null, onSelect, onAction,
  }: {
    entries: readonly FeedEntry[]
    variant?: FeedLayoutVariant
    selectedId?: string | null
    onSelect: (id: string) => void
    onAction: (id: string) => void
  } = $props()
</script>

{#snippet renderActions(entry: FeedEntry)}
  <button type="button" aria-label={`Archive ${entry.title}`} onclick={() => onAction(entry.id)}>Archive</button>
{/snippet}

<FeedLayout {entries} {variant} {selectedId} {onSelect} {renderActions} sourceLabels={{ source: 'Channel · rss' }} />
