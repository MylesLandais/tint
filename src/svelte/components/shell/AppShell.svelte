<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    nav?: Snippet
    navPosition?: 'rail' | 'top'
    header?: Snippet
    aside?: Snippet
    status?: Snippet
    children?: Snippet
  }
  let { nav, navPosition = 'rail', header, aside, status, children, class: className, ...rest }: Props = $props()
  let top = $derived(navPosition === 'top')
</script>

<div {...rest} data-tint-app-shell class={['@container/app-shell min-h-dvh bg-tint-surface text-tint-ink', className]}>
  <div data-tint-app-shell-layout data-nav-position={navPosition} class={[
    'grid min-h-dvh grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] @3xl/app-shell:h-dvh @3xl/app-shell:overflow-hidden',
    top ? '@6xl/app-shell:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]'
      : '@3xl/app-shell:grid-cols-[auto_minmax(0,1fr)] @3xl/app-shell:grid-rows-[auto_minmax(0,1fr)_auto] @6xl/app-shell:grid-cols-[auto_minmax(0,1fr)_minmax(16rem,24rem)]',
    !aside && (top ? '@6xl/app-shell:grid-cols-1' : '@6xl/app-shell:grid-cols-[auto_minmax(0,1fr)]'),
  ]}>
    {#if nav}
      <div data-tint-app-shell-nav class={top ? aside ? '@6xl/app-shell:col-span-2' : '' : '@3xl/app-shell:row-start-1 @3xl/app-shell:col-start-1 @3xl/app-shell:row-span-3 @3xl/app-shell:min-h-0'}>
        {@render nav()}
      </div>
    {/if}
    {#if header}
      <div data-tint-app-shell-header class={top ? '' : ['@3xl/app-shell:row-start-1 @3xl/app-shell:col-start-2', aside && '@6xl/app-shell:col-span-2 @6xl/app-shell:col-start-2']}>
        {@render header()}
      </div>
    {/if}
    <main data-tint-workspace class={top ? 'min-w-0 overflow-auto' : 'min-h-0 min-w-0 overflow-auto @3xl/app-shell:row-start-2 @3xl/app-shell:col-start-2'}>
      {@render children?.()}
    </main>
    {#if aside}
      <aside data-tint-app-shell-aside class={top
        ? 'hidden min-w-0 overflow-auto border-l border-tint-border @6xl/app-shell:col-start-2 @6xl/app-shell:row-start-3 @6xl/app-shell:block'
        : 'hidden min-w-0 overflow-auto border-l border-tint-border @6xl/app-shell:col-start-3 @6xl/app-shell:row-start-2 @6xl/app-shell:block'}>
        {@render aside()}
      </aside>
    {/if}
    {#if status}
      <div data-tint-app-shell-status class={top ? aside ? '@6xl/app-shell:col-span-2' : '' : ['@3xl/app-shell:row-start-3 @3xl/app-shell:col-start-2', aside && '@6xl/app-shell:col-span-2 @6xl/app-shell:col-start-2']}>
        {@render status()}
      </div>
    {/if}
  </div>
</div>
