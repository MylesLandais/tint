<!--
  One media cell. A link (opens the viewer) with an optional selection check,
  kind badge and people count. Square corners per house rules.
-->
<script lang="ts">
  import { Film, ImageOff, Play, Repeat, Users } from "@lucide/svelte"
  import { Icon } from "@nebula/tint/icon"
  import FirstFrame from "./FirstFrame.svelte"
  import HoverPreview from "./HoverPreview.svelte"

  type Source = { type: string; srcset: string }
  type Props = {
    href: string
    src: string
    sources?: readonly Source[]
    sizes?: string
    /** Original media URL, used for a first-frame fallback and hover preview. */
    videoSrc?: string
    alt: string
    kind?: string
    people?: number
    selected?: boolean
    active?: boolean
    onopen?: (event: MouseEvent) => void
    onfocus?: () => void
  }
  let { href, src, sources = [], sizes = "25vw", videoSrc, alt, kind = "image", people = 0, selected = false,
    active = false, onopen, onfocus }: Props = $props()
  let failed = $state(false)
  let loaded = $state(false)
  let hovered = $state(false)
  // Videos without a stored thumbnail fall back to their first frame.
  const fallbackVideo = $derived(failed && (kind === "video" || kind === "gif") ? videoSrc : null)
  const canPreview = $derived((kind === "video" || kind === "gif") && !!videoSrc)
</script>

<a
  data-tint-media-tile
  data-selected={selected || undefined}
  data-active={active || undefined}
  {href}
  class="group absolute inset-0 block overflow-hidden rounded-[2px] bg-[light-dark(var(--tint-border),var(--tint-panel))] outline-none
         focus-visible:ring-2 focus-visible:ring-tint-focus focus-visible:ring-offset-1
         data-[selected]:ring-2 data-[selected]:ring-tint-accent"
  aria-label={alt}
  onclick={onopen}
  {onfocus}
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
>
  {#if !loaded}
    <span class="absolute inset-0 flex items-center justify-center text-tint-muted/70" aria-hidden="true">
      <Icon icon={kind === "video" || kind === "gif" ? Film : ImageOff} size="lg" />
    </span>
  {/if}
  {#if fallbackVideo}
    <FirstFrame src={fallbackVideo} onready={() => (loaded = true)} />
  {:else if !failed}
    <picture>
      {#each sources as source (source.type)}
        <source type={source.type} srcset={source.srcset} {sizes} />
      {/each}
      <img
        {src}
        {alt}
        loading="lazy"
        decoding="async"
        draggable="false"
        class="h-full w-full object-cover transition-transform duration-[180ms] group-hover:scale-[1.015] motion-reduce:transition-none"
        onload={() => (loaded = true)}
        onerror={() => (failed = true)}
      />
    </picture>
  {/if}
  {#if canPreview}
    {#if hovered}
      <div class="absolute inset-0 opacity-0 transition-opacity duration-[110ms] group-hover:opacity-100 motion-reduce:hidden">
        <HoverPreview src={videoSrc ?? ""} onstarted={() => (loaded = true)} />
      </div>
    {/if}
  {/if}
  {#if kind === "video" || kind === "gif"}
    <span class="absolute right-1 top-1 flex items-center rounded-[2px] bg-tint-ink/70 p-0.5 text-tint-bg" title={kind}>
      <Icon icon={kind === "gif" ? Repeat : Play} size="xs" label={kind} />
    </span>
  {/if}
  {#if people > 0}
    <span class="absolute bottom-1 left-1 flex items-center gap-1 rounded-[2px] bg-tint-ink/70 px-1 py-px font-mono text-[0.6875rem] text-tint-bg opacity-0 transition-opacity duration-[110ms] group-hover:opacity-100 group-focus-visible:opacity-100">
      <Icon icon={Users} size="xs" />{people}
    </span>
  {/if}
</a>
