<script lang="ts">
  import type { ActivityEvent } from '../../../core/activity'
  import ActivityFeed from './ActivityFeed.svelte'

  let {
    events, onSelect, onAction,
  }: {
    events: readonly ActivityEvent[]
    onSelect: (eventId: string) => void
    onAction: (eventId: string) => void
  } = $props()
</script>

{#snippet actions(event: ActivityEvent)}<button type="button" onclick={() => onAction(event.id)}>Action {event.title}</button>{/snippet}
<ActivityFeed {events} {onSelect} renderActions={actions} />
