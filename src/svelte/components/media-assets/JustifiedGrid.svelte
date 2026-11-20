<!--
  Justified media rows (Immich / Google Photos). Measures its own width and
  lays items out with core/justify; the caller renders each tile.
-->
<script lang="ts" generics="T extends { aspect: number }">
  import type { Snippet } from "svelte"
  import { justify, type JustifiedBox } from "./core/justify"

  type Props = {
    items: readonly T[]
    targetHeight?: number
    gap?: number
    tile: Snippet<[T, JustifiedBox]>
    class?: string
  }
  let { items, targetHeight = 200, gap = 4, tile, class: className }: Props = $props()
  let width = $state(0)
  const rows = $derived(justify(items, { width, targetHeight, gap }))
</script>

<div data-tint-justified-grid class={["flex min-w-0 flex-col", className]} style:gap="{gap}px" bind:clientWidth={width}>
  {#each rows as row, r (r)}
    <div data-tint-justified-row class="flex min-w-0" style:gap="{gap}px" style:height="{row.height}px">
      {#each row.boxes as box (box.index)}
        <div class="relative shrink-0" style:width="{box.width}px" style:height="{box.height}px">
          {@render tile(items[box.index], box)}
        </div>
      {/each}
    </div>
  {/each}
</div>
