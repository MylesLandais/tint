<!--
  Thumbnail cropped to a face box. ``box`` is pixel [x1, y1, x2, y2] in the
  source image's natural size. The crop is padded and kept square; the image is
  positioned with CSS once its natural size is known (no canvas, no CORS).
-->
<script lang="ts">
  type Props = {
    src: string
    box: readonly number[]
    size?: number
    padding?: number
    round?: boolean
    alt?: string
    /** When set, the crop renders as a button with ``alt`` as its name. */
    onclick?: () => void
    title?: string
  }
  let { src, box, size = 48, padding = 1.5, round = false, alt = "", onclick, title }: Props = $props()
  let natural = $state<{ w: number; h: number } | null>(null)

  const layout = $derived.by(() => {
    if (!natural || box.length < 4) return null
    const [x1, y1, x2, y2] = box
    const side = Math.max(x2 - x1, y2 - y1) * padding
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const left = Math.min(Math.max(cx - side / 2, 0), Math.max(natural.w - side, 0))
    const top = Math.min(Math.max(cy - side / 2, 0), Math.max(natural.h - side, 0))
    const scale = size / side
    return { w: natural.w * scale, h: natural.h * scale, x: -left * scale, y: -top * scale }
  })
</script>

{#snippet crop(decorative: boolean)}
  <img
    {src}
    alt={decorative ? "" : alt}
    loading="lazy"
    decoding="async"
    class="absolute max-w-none"
    style:width={layout ? `${layout.w}px` : "100%"}
    style:height={layout ? `${layout.h}px` : "100%"}
    style:left={layout ? `${layout.x}px` : "0"}
    style:top={layout ? `${layout.y}px` : "0"}
    style:object-fit={layout ? "fill" : "cover"}
    onload={(event) => {
      const img = event.currentTarget as HTMLImageElement
      natural = { w: img.naturalWidth, h: img.naturalHeight }
    }}
  />
{/snippet}

{#if onclick}
  <button
    type="button"
    aria-label={alt}
    {title}
    {onclick}
    data-tint-face-crop
    class={["relative inline-block shrink-0 cursor-pointer overflow-hidden bg-tint-surface p-0 outline-none focus-visible:ring-2 focus-visible:ring-tint-focus", round ? "rounded-full" : "rounded-[2px]"]}
    style:width="{size}px"
    style:height="{size}px"
  >{@render crop(true)}</button>
{:else}
  <span
    {title}
    data-tint-face-crop
    class={["relative inline-block shrink-0 overflow-hidden bg-tint-surface", round ? "rounded-full" : "rounded-[2px]"]}
    style:width="{size}px"
    style:height="{size}px"
  >{@render crop(false)}</span>
{/if}
