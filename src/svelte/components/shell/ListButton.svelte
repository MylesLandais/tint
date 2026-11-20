<!--
  Full-width row button for lists (facets, triage, streams, markers). The
  current/pressed row carries a left accent bar plus selection fill, so state
  never relies on colour alone.
-->
<script lang="ts">
  import type { Snippet } from "svelte"

  type Props = {
    onclick?: (event: MouseEvent) => void
    onmouseenter?: () => void
    onmouseleave?: () => void
    current?: boolean
    pressed?: boolean
    disabled?: boolean
    title?: string
    id?: string
    density?: "compact" | "default" | "roomy"
    leading?: Snippet
    trailing?: Snippet
    children: Snippet
    class?: string
  }
  let { onclick, onmouseenter, onmouseleave, current, pressed, disabled, title, id, density = "default",
    leading, trailing, children, class: className }: Props = $props()
  const pad = { compact: "py-[3px]", default: "py-1", roomy: "py-2" } as const
  const on = $derived(Boolean(current || pressed))
</script>

<button
  type="button"
  data-tint-list-button
  {id}
  {title}
  {disabled}
  aria-current={current ? "true" : undefined}
  aria-pressed={pressed}
  {onclick}
  {onmouseenter}
  {onmouseleave}
  class={[
    "flex w-full items-center gap-2 border-l-2 pl-[10px] pr-3 text-left outline-none transition-colors duration-[110ms]",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tint-focus disabled:opacity-60",
    on ? "border-tint-accent bg-tint-selection" : "border-transparent hover:bg-tint-selection",
    pad[density],
    className,
  ]}
>
  {#if leading}{@render leading()}{/if}
  <span class="min-w-0 flex-1">{@render children()}</span>
  {#if trailing}{@render trailing()}{/if}
</button>
