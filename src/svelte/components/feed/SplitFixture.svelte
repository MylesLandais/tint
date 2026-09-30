<script lang="ts">
  import SplitPane from './SplitPane.svelte'
  let {
    three = false, startWidth = '250px', onStartWidthChange, onMiddleWidthChange,
  }: {
    three?: boolean
    startWidth?: string
    onStartWidthChange: (width: number) => void
    onMiddleWidthChange?: (width: number) => void
  } = $props()
</script>

{#snippet start()}Start{/snippet}
{#snippet middle()}Middle{/snippet}
{#snippet end()}End{/snippet}

<SplitPane {start} {middle} end={three ? end : undefined} {startWidth} {onStartWidthChange} {onMiddleWidthChange} />
