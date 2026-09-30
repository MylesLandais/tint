<script lang="ts">
  import { sourceHealthBadge } from '../../../core/feed'
  import Badge from '../badge/Badge.svelte'
  import type { SourceHealthBadgeProps } from './types'
  let { health, class: className }: SourceHealthBadgeProps = $props()
  let badge = $derived(sourceHealthBadge(health))
</script>

<Badge tone={badge.tone} class={className} data-tint-source-health={health}>{badge.label}</Badge>
