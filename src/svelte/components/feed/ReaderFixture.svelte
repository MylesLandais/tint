<script lang="ts">
  import HighlightLayer from './HighlightLayer.svelte'
  import ReaderPane from './ReaderPane.svelte'

  let { onHighlightClick }: { onHighlightClick: (id: string) => void } = $props()
</script>

{#snippet header()}Reader header{/snippet}
{#snippet overlay()}
  <HighlightLayer text="abcdefghij" highlights={[{ id: 'middle', start: 2, end: 5 }]} activeId="middle" {onHighlightClick} />
{/snippet}

<ReaderPane {header} highlightLayer={overlay}>abcdefghij</ReaderPane>
