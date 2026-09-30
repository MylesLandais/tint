<script lang="ts">
  import DataMasonry from './DataMasonry.svelte'
  type Item = { id: string; title: string }
  let { rows }: { rows: readonly Item[] } = $props()
</script>

{#snippet item(row: Item)}<span>{row.title}</span>{/snippet}
<DataMasonry {rows} rowId="id" renderItem={item} label="Albums" />
