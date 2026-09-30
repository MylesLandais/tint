<script lang="ts">
  import type { Snippet } from 'svelte'
  import Surface from './Surface.svelte'
  import type { ComponentProps } from 'svelte'

  type Props = Omit<ComponentProps<typeof Surface>, 'children'> & {
    header?: Snippet
    actions?: Snippet
    footer?: Snippet
    children?: Snippet
    bodyClassName?: string
  }

  let { as = 'article', header, actions, footer, children, bodyClassName, density = 'default', ...rest }: Props = $props()
</script>

<Surface {...rest} {as} {density} data-tint-card="">
  {#if header || actions}
    <header class="head">
      <div class="head-main">{@render header?.()}</div>
      {#if actions}<div class="head-actions">{@render actions()}</div>{/if}
    </header>
  {/if}
  <div class={['body', bodyClassName].filter(Boolean).join(' ')}>{@render children?.()}</div>
  {#if footer}<footer class="foot">{@render footer()}</footer>{/if}
</Surface>

<style>
  .head,
  .body,
  .foot {
    padding: var(--tint-space-3) var(--tint-space-4);
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--tint-space-3);
    border-bottom: 1px solid var(--tint-border);
  }
  .head-main {
    min-width: 0;
    flex: 1;
  }
  .head-actions {
    flex-shrink: 0;
  }
  .foot {
    border-top: 1px solid var(--tint-border);
  }
  :global([data-tint-card][data-density='compact']) .head,
  :global([data-tint-card][data-density='compact']) .body,
  :global([data-tint-card][data-density='compact']) .foot {
    padding: var(--tint-space-2) var(--tint-space-3);
  }
</style>
