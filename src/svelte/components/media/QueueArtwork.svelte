<script lang="ts">
  import MediaPlaceholder from './MediaPlaceholder.svelte'
  let { src }: { src?: string } = $props()
  let failedSource = $state<string | null>(null)
</script>

{#if src && src !== failedSource}
  <img {src} alt="" onerror={() => failedSource = src} />
{:else}
  <MediaPlaceholder />
{/if}

<style>
  img { width: 100%; height: 100%; object-fit: cover; }
</style>
