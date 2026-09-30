<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { BadgeTone } from './types'

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
    /** Semantic tone. Maps to Tint status tokens, never to a literal colour. */
    tone?: BadgeTone
    leading?: Snippet
    children?: Snippet
  }

  let { tone = 'neutral', leading, children, class: className, ...rest }: Props = $props()
</script>

<span {...rest} class={['tint-badge', className]} data-badge="" data-tone={tone}>
  {@render leading?.()}
  <span class="label">{@render children?.()}</span>
</span>

<style>
  .tint-badge {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    gap: var(--tint-space-1);
    padding: 0.125rem 0.375rem;
    border: 1px solid var(--tint-border);
    border-radius: var(--tint-radius-sm);
    background: var(--tint-surface);
    color: var(--tint-muted);
    font-size: var(--tint-font-size-xs);
    font-weight: 500;
    line-height: var(--tint-leading-normal);
  }
  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tint-badge[data-tone='accent'] {
    border-color: color-mix(in srgb, var(--tint-accent) 30%, transparent);
    background: var(--tint-accent-soft);
    color: var(--tint-ink);
  }
  .tint-badge[data-tone='success'] {
    border-color: color-mix(in srgb, var(--tint-success) 30%, transparent);
    background: var(--tint-success-soft);
    color: var(--tint-success-ink);
  }
  .tint-badge[data-tone='warning'] {
    border-color: color-mix(in srgb, var(--tint-warning) 30%, transparent);
    background: var(--tint-warning-soft);
    color: var(--tint-warning-ink);
  }
  .tint-badge[data-tone='danger'] {
    border-color: color-mix(in srgb, var(--tint-danger) 30%, transparent);
    background: var(--tint-danger-soft);
    color: var(--tint-danger-ink);
  }
  .tint-badge[data-tone='info'] {
    border-color: color-mix(in srgb, var(--tint-info) 30%, transparent);
    background: var(--tint-info-soft);
    color: var(--tint-info-ink);
  }
</style>
