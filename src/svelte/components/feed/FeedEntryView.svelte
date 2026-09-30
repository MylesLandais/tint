<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { FeedEntry } from '../../../core/feed'
  import FeedEntryCard from './FeedEntryCard.svelte'
  import FeedEntryRow from './FeedEntryRow.svelte'

  let {
    entry, kind, sourceLabel, selected, onSelect, renderActions,
  }: {
    entry: FeedEntry
    kind: 'card' | 'row'
    sourceLabel?: string
    selected: boolean
    onSelect?: (entryId: string) => void
    renderActions?: Snippet<[FeedEntry]>
  } = $props()
</script>

{#snippet actions()}{@render renderActions?.(entry)}{/snippet}

{#if kind === 'card'}
  <FeedEntryCard {entry} {sourceLabel} {selected} {onSelect} actions={renderActions ? actions : undefined} />
{:else}
  <FeedEntryRow {entry} {sourceLabel} {selected} {onSelect} actions={renderActions ? actions : undefined} />
{/if}
