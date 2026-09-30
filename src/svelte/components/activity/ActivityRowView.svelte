<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ActivityEvent } from '../../../core/activity'
  import ActivityFeedRow from './ActivityFeedRow.svelte'
  let {
    event, selected, onSelect, renderActions,
  }: {
    event: ActivityEvent
    selected: boolean
    onSelect?: (eventId: string) => void
    renderActions?: Snippet<[ActivityEvent]>
  } = $props()
</script>

{#snippet actions()}{@render renderActions?.(event)}{/snippet}
<ActivityFeedRow {event} {selected} {onSelect} actions={renderActions ? actions : undefined} />
