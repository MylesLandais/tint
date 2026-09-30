<script lang="ts">
  let { file }: { file: File } = $props()
  let url = $state<string | null>(null)
  $effect(() => {
    if (!file.type.startsWith('image/') || typeof URL.createObjectURL !== 'function') { url = null; return }
    const next = URL.createObjectURL(file)
    url = next
    return () => { URL.revokeObjectURL(next); url = null }
  })
</script>

{#if url}<img src={url} alt="" />{/if}

<style>
  img { width: 2.5rem; height: 2.5rem; border-radius: var(--tint-radius-sm); object-fit: cover; }
</style>
