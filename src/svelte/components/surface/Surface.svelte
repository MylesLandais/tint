<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { SurfaceTone, SurfaceElevation, SurfaceDensity } from './types'

  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    as?: 'div' | 'section' | 'article' | 'aside'
    tone?: SurfaceTone
    elevation?: SurfaceElevation
    density?: SurfaceDensity
    interactive?: boolean
    selected?: boolean
    /** Clip children to the rounded border (used by Panel). */
    clip?: boolean
    children?: Snippet
  }

  let {
    as = 'div',
    tone = 'default',
    elevation = 'none',
    density = 'default',
    interactive = false,
    selected = false,
    clip = false,
    children,
    class: className,
    ...rest
  }: Props = $props()
</script>

<svelte:element
  this={as}
  {...rest}
  class={['tint-surface', className]}
  data-tint-surface=""
  data-tone={tone}
  data-elevation={elevation}
  data-density={density}
  data-interactive={interactive || undefined}
  data-selected={selected || undefined}
  data-clip={clip || undefined}
>
  {@render children?.()}
</svelte:element>

<style>
  .tint-surface {
    border: 1px solid var(--tint-border);
    border-radius: var(--tint-radius-lg);
    background: var(--tint-panel);
    color: var(--tint-ink);
  }
  .tint-surface[data-tone='subtle'] {
    background: var(--tint-surface);
  }
  .tint-surface[data-tone='accent'] {
    border-color: color-mix(in srgb, var(--tint-accent) 40%, transparent);
    background: var(--tint-accent-soft);
  }
  .tint-surface[data-tone='danger'] {
    border-color: color-mix(in srgb, var(--tint-danger) 40%, transparent);
    background: var(--tint-danger-soft);
    color: var(--tint-danger-ink);
  }
  .tint-surface[data-elevation='sm'] {
    box-shadow: 0 1px 2px var(--tint-shadow-color);
  }
  .tint-surface[data-elevation='md'] {
    box-shadow: 0 4px 10px -2px var(--tint-shadow-color);
  }
  .tint-surface[data-elevation='lg'] {
    box-shadow: 0 12px 24px -6px var(--tint-shadow-color);
  }
  .tint-surface[data-clip] {
    overflow: hidden;
  }
  .tint-surface[data-interactive] {
    transition: background-color var(--tint-motion-fast) var(--tint-ease);
  }
  .tint-surface[data-interactive]:hover {
    background: var(--tint-surface);
  }
  .tint-surface[data-interactive]:focus-visible {
    outline: var(--tint-focus-width) solid var(--tint-focus);
    outline-offset: var(--tint-focus-offset);
  }
  .tint-surface[data-selected] {
    box-shadow: 0 0 0 2px var(--tint-focus);
  }
</style>
