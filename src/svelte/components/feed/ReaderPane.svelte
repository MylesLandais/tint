<script lang="ts">
  import type { ReaderPaneProps } from './types'
  let { header, highlightLayer, children, class: className, ...rest }: ReaderPaneProps = $props()
</script>

<article {...rest} data-tint-reader-pane="" class={['reader-pane', className].filter(Boolean).join(' ')}>
  {#if header}<header data-tint-reader-header="">{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}</header>{/if}
  <div data-tint-reader-scroll="" class="scroll">
    {@render highlightLayer?.()}
    <div data-tint-reader-body="" class="body">{@render children()}</div>
  </div>
</article>

<style>
  .reader-pane { position: relative; display: flex; height: 100%; min-height: 0; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  header { position: sticky; top: 0; z-index: 10; flex: none; border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); padding: var(--tint-space-3) var(--tint-space-4); }
  .scroll { position: relative; min-height: 0; flex: 1; overflow: auto; }
  .body { position: relative; z-index: 0; padding: var(--tint-space-4); color: var(--tint-ink); font-size: var(--tint-font-size-sm); line-height: 1.75; }
</style>
