<script lang="ts">
  import type { Snippet } from 'svelte'
  import Spinner from '../icon/Spinner.svelte'

  type Label = string | Snippet
  type Props = {
    hasMore: boolean
    loading?: boolean
    onLoadMore: () => void
    rootMargin?: string
    /** Change this when new rows arrive, including synchronous loads, to re-arm the sentinel. */
    rearmKey?: string | number
    empty?: boolean
    loadingLabel?: Label
    endLabel?: Label
    emptyLabel?: Label
    class?: string
  }

  let {
    hasMore, loading = false, onLoadMore, rootMargin = '600px', rearmKey,
    empty = false, loadingLabel = 'Loading more…', endLabel = 'End of results',
    emptyLabel = '', class: className,
  }: Props = $props()
  let sentinel = $state<HTMLDivElement | null>(null)

  $effect(() => {
    void rearmKey
    const node = sentinel
    if (!node || !hasMore || loading || typeof IntersectionObserver === 'undefined') return
    let fired = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || fired) return
      fired = true
      observer.disconnect()
      onLoadMore()
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  })
</script>

<div bind:this={sentinel} data-infinite-rows="" data-state={empty ? 'empty' : loading ? 'loading' : hasMore ? 'ready' : 'end'} class={className}>
  <span aria-live="polite">
    {#if empty}
      {#if typeof emptyLabel === 'string'}{emptyLabel}{:else}{@render emptyLabel()}{/if}
    {:else if loading}
      <Spinner size="sm" />
      {#if typeof loadingLabel === 'string'}{loadingLabel}{:else}{@render loadingLabel()}{/if}
    {:else if !hasMore}
      {#if typeof endLabel === 'string'}{endLabel}{:else}{@render endLabel()}{/if}
    {/if}
  </span>
</div>

<style>
  [data-infinite-rows] { display: flex; min-height: 2.75rem; align-items: center; justify-content: center; gap: var(--tint-space-2); padding: var(--tint-space-3) 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  [aria-live] { display: inline-flex; align-items: center; gap: var(--tint-space-2); }
</style>
