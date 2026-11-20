<!-- Square icon-only button. ``label`` is required: it is the accessible name. -->
<script lang="ts">
  import type { LucideIcon } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { Icon, type IconSize } from "@nebula/tint/icon"

  type Props = {
    icon: LucideIcon
    label: string
    onclick?: (event: MouseEvent) => void
    pressed?: boolean
    size?: "sm" | "md" | "lg"
    tone?: "default" | "overlay"
    title?: string
    children?: Snippet
    class?: string
  }
  let { icon, label, onclick, pressed, size = "md", tone = "default", title, children, class: className }: Props = $props()
  const box = { sm: "h-7 min-w-7", md: "h-8 min-w-8", lg: "h-10 min-w-10" } as const
  const glyph: Record<string, IconSize> = { sm: "sm", md: "md", lg: "lg" }
</script>

<button
  type="button"
  data-tint-icon-button
  aria-label={label}
  aria-pressed={pressed}
  title={title ?? label}
  {onclick}
  class={[
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] px-1 text-xs outline-none transition-colors duration-[110ms]",
    "focus-visible:ring-2 focus-visible:ring-tint-focus",
    tone === "overlay" ? "bg-tint-panel/80 text-tint-ink hover:bg-tint-panel" : "text-tint-muted hover:bg-tint-selection hover:text-tint-ink",
    "aria-pressed:text-tint-accent aria-pressed:bg-tint-selection",
    box[size],
    className,
  ]}
>
  <Icon {icon} size={glyph[size]} />
  {#if children}{@render children()}{/if}
</button>
