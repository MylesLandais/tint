<script lang="ts">
  import { ChevronLeft, ChevronRight, ExternalLink } from '@lucide/svelte'
  import { safeAssetIndex, type MediaAsset } from '../../../core/media/assets'
  import Dialog from '../dialog/Dialog.svelte'
  import Icon from '../icon/Icon.svelte'

  type Props = {
    open: boolean
    assets: readonly MediaAsset[]
    index: number
    onClose: () => void
    onIndexChange: (index: number) => void
    class?: string
  }
  let { open, assets, index, onClose, onIndexChange, class: className }: Props = $props()
  let safeIndex = $derived(safeAssetIndex(index, assets.length))
  let current = $derived(assets[safeIndex])
  let touchStart = 0

  function previous() { if (safeIndex > 0) onIndexChange(safeIndex - 1) }
  function next() { if (safeIndex < assets.length - 1) onIndexChange(safeIndex + 1) }

  $effect(() => {
    if (!open || !current) return
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous() }
      else if (event.key === 'ArrowRight') { event.preventDefault(); next() }
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  function onTouchEnd(event: TouchEvent) {
    const end = event.changedTouches[0]?.clientX
    if (end === undefined || Math.abs(end - touchStart) < 45) return
    if (end < touchStart) next()
    else previous()
  }
</script>

{#if current}
  <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }} title={(current.caption ?? current.alt) || 'Media preview'} class={['tint-media-lightbox-panel', className].filter(Boolean).join(' ')}>
    <!-- Swipe support is pointer-only; adjacent buttons and arrow keys provide other paths. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div role="presentation" class="preview" ontouchstart={(event) => { touchStart = event.touches[0]?.clientX ?? 0 }} ontouchend={onTouchEnd}>
      {#if safeIndex > 0}<button type="button" class="previous" aria-label="Previous" onclick={previous}><Icon icon={ChevronLeft} /></button>{/if}
      <img src={current.src} alt={current.alt} width={current.width} height={current.height} />
      {#if safeIndex < assets.length - 1}<button type="button" class="next" aria-label="Next" onclick={next}><Icon icon={ChevronRight} /></button>{/if}
    </div>
    <div class="meta">
      {#if assets.length > 1}<p>{safeIndex + 1} of {assets.length}</p>{/if}
      {#if current.href}<a href={current.href} target="_blank" rel="noopener noreferrer"><Icon icon={ExternalLink} size="sm" />View original</a>{/if}
    </div>
  </Dialog>
{/if}

<style>
  :global(.tint-media-lightbox-panel) { max-width: 64rem !important; }
  .preview { position: relative; display: flex; max-height: 70dvh; align-items: center; justify-content: center; }
  img { display: block; max-width: 100%; max-height: 70dvh; object-fit: contain; }
  button { position: absolute; top: 50%; z-index: 1; display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-ink); cursor: pointer; transform: translateY(-50%); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .previous { left: .25rem; }
  .next { right: .25rem; }
  .meta { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  p { margin: .75rem 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  a { display: inline-flex; align-items: center; gap: .25rem; margin-top: .75rem; color: var(--tint-accent); font-size: var(--tint-font-size-sm); }
</style>
