<!-- Collapsible section heading (Lightroom panel header). -->
<script lang="ts">
  import { ChevronDown, ChevronRight } from "@lucide/svelte"
  import { Icon } from "@nebula/tint/icon"
  let { label, expanded, ontoggle }: { label: string; expanded: boolean; ontoggle: () => void } = $props()
</script>

<button
  type="button"
  data-tint-section-toggle
  aria-expanded={expanded}
  onclick={ontoggle}
  class="flex w-full items-center gap-1 px-2 py-1 text-left text-[0.6875rem] font-medium uppercase tracking-wide text-tint-muted outline-none hover:text-tint-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tint-focus"
>
  <Icon icon={expanded ? ChevronDown : ChevronRight} size="xs" />
  {label}
</button>
