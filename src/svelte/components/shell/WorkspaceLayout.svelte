<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cssLength, workspaceBodyColumns, type WorkspaceSplitMode } from '../../../core/shell/layout'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    theme?: string
    navigation?: Snippet
    toolbar?: Snippet
    primary: Snippet
    inspector?: Snippet
    drawer?: Snippet
    drawerMode?: 'inline' | 'overlay'
    split?: WorkspaceSplitMode
    navigationWidth?: string | number
    inspectorWidth?: string | number
    drawerHeight?: string | number
  }
  let {
    theme = 'default', navigation, toolbar, primary, inspector, drawer,
    drawerMode = 'inline', split = 'container', navigationWidth = '16rem',
    inspectorWidth = '20rem', drawerHeight = '16rem',
    class: className, style, ...rest
  }: Props = $props()
  let columns = $derived(workspaceBodyColumns({ navigation: !!navigation, inspector: !!inspector, split }))
  let variables = $derived(`--workspace-navigation-width: ${cssLength(navigationWidth)}; --workspace-inspector-width: ${cssLength(inspectorWidth)}; --workspace-drawer-height: ${cssLength(drawerHeight)}; container-type: inline-size; ${style ?? ''}`)
</script>

<div {...rest} data-tint-workspace-layout data-theme={theme}
  class={['@container/workspace relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-tint-surface text-tint-ink', className]}
  style={variables}>
  {#if toolbar}
    <div data-tint-workspace-toolbar class="col-span-full min-w-0 border-b border-tint-border bg-tint-panel">{@render toolbar()}</div>
  {/if}
  <div data-tint-workspace-body class={[
    'grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-auto @4xl/workspace:overflow-hidden',
    split === 'always' && 'overflow-hidden', columns,
  ]}>
    {#if navigation}
      <div data-tint-workspace-navigation class={[
        'min-h-0 min-w-0 overflow-auto border-tint-border bg-tint-panel',
        split === 'always' ? 'border-r' : 'border-b @4xl/workspace:border-b-0 @4xl/workspace:border-r',
      ]}>{@render navigation()}</div>
    {/if}
    <div data-tint-workspace-primary class="min-h-0 min-w-0 overflow-auto">{@render primary()}</div>
    {#if inspector}
      <div data-tint-workspace-inspector class={[
        'min-h-0 min-w-0 overflow-auto border-tint-border bg-tint-panel',
        split === 'always' ? 'border-l' : 'border-t @4xl/workspace:border-l @4xl/workspace:border-t-0',
      ]}>{@render inspector()}</div>
    {/if}
  </div>
  {#if drawer}
    <div data-tint-workspace-drawer data-drawer-mode={drawerMode} class={[
      'col-span-full min-h-0 min-w-0 overflow-auto border-t border-tint-border bg-tint-panel',
      drawerMode === 'inline' && 'h-[var(--workspace-drawer-height)]',
      drawerMode === 'overlay' && 'absolute inset-x-0 bottom-0 z-20 h-[var(--workspace-drawer-height)] shadow-xl',
    ]}>{@render drawer()}</div>
  {/if}
</div>
