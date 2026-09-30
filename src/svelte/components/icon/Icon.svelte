<!--
  The single seam every Svelte icon renders through, and the only place (with
  glyphs.ts) that touches @lucide/svelte. Takes the glyph as a value
  (`icon={Search}`) and a Tint size step, never a raw pixel size.
-->
<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte'
  import { ICON_PX, type IconSize } from '../../../core/icon/sizes'

  type Props = {
    icon: LucideIcon
    size?: IconSize
    /** Accessible name. Without it the icon is decorative and hidden from AT. */
    label?: string
    class?: string
  }

  let { icon: Glyph, size = 'md', label, class: className }: Props = $props()
</script>

<Glyph
  size={ICON_PX[size]}
  class={className}
  aria-hidden={label ? undefined : 'true'}
  aria-label={label}
  role={label ? 'img' : undefined}
/>
