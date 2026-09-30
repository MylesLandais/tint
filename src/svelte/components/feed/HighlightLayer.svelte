<script lang="ts">
  import { highlightPieces } from '../../../core/feed'
  import type { HighlightLayerProps } from './types'

  let { text, highlights, activeId = null, onHighlightClick, class: className, ...rest }: HighlightLayerProps = $props()
  let pieces = $derived(highlightPieces(text, highlights))
</script>

<div {...rest} data-tint-highlight-layer="" aria-hidden={!onHighlightClick} class={['highlight-layer', className].filter(Boolean).join(' ')}>
  {#each pieces as piece (piece.key)}
    {#if piece.highlight}
      <mark
        data-tint-highlight={piece.highlight.id} data-tone={piece.highlight.tone ?? 'accent'}
        data-active={activeId === piece.highlight.id || undefined}
      >{#if onHighlightClick}<button type="button" aria-label={`Highlight: ${piece.content}`} onclick={() => onHighlightClick?.(piece.highlight!.id)}>{piece.content}</button>{:else}{piece.content}{/if}</mark>
    {:else}
      <span aria-hidden="true">{piece.content}</span>
    {/if}
  {/each}
</div>

<style>
  .highlight-layer { pointer-events: none; position: absolute; inset: 0; z-index: 1; padding: var(--tint-space-4); color: transparent; font-size: var(--tint-font-size-sm); line-height: 1.75; white-space: pre-wrap; }
  mark { pointer-events: none; border-radius: var(--tint-radius-sm); color: transparent; }
  mark[data-tone='accent'] { background: color-mix(in srgb, var(--tint-accent) 25%, transparent); }
  mark[data-tone='warning'] { background: color-mix(in srgb, var(--tint-warning) 30%, transparent); }
  mark[data-tone='success'] { background: color-mix(in srgb, var(--tint-success) 25%, transparent); }
  mark[data-active] { box-shadow: 0 0 0 1px var(--tint-accent); }
  button { pointer-events: auto; border: 0; border-radius: inherit; background: transparent; padding: 0; color: transparent; cursor: pointer; font: inherit; line-height: inherit; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
