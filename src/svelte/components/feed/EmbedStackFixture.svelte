<script lang="ts">
  import EmbedStack from './EmbedStack.svelte'

  let { items }: { items: string[] } = $props()
</script>

<EmbedStack label="Updates" {items} itemKey={item => item}>
  {#snippet children(item)}<p>{item}</p>{/snippet}
</EmbedStack>
