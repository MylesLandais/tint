<script lang="ts">
  import type { MediaAsset } from '../../../core/media/assets'

  type Props = {
    assets: readonly MediaAsset[]
    onSelect?: (index: number, asset: MediaAsset) => void
    class?: string
  }
  let { assets, onSelect, class: className }: Props = $props()
</script>

<div data-tint-gallery-grid="" class={['tint-gallery-grid', className].filter(Boolean).join(' ')}>
  <div class="tiles">
    {#each assets as asset, index (asset.id)}
      {#if onSelect}
        <button type="button" aria-label={`View ${asset.alt || asset.caption || `media ${index + 1}`}`} onclick={() => onSelect?.(index, asset)}>
          <img src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} />
        </button>
      {:else}
        <div class="tile"><img src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} /></div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .tint-gallery-grid { container-type: inline-size; }
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
  button, .tile { display: block; overflow: hidden; border: 0; border-radius: var(--tint-radius-lg); padding: 0; background: var(--tint-surface); }
  button { cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
  @container (min-width: 36rem) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
