<script lang="ts">
  import { onMount, tick } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { overflowDistance, scrollCycleSeconds } from '../../../core/scrolling-label/model'

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
    /** Full, single-line text; only scrolls when the content overflows. */
    text: string
  }

  let { text, title, class: className, ...rest }: Props = $props()
  let container = $state<HTMLSpanElement>()
  let content = $state<HTMLSpanElement>()
  let overflowPx = $state(0)
  let observer: ResizeObserver | undefined
  let observedContent: HTMLSpanElement | undefined
  let mounted = false

  function measure() {
    if (!container || !content) return
    overflowPx = overflowDistance(container.clientWidth, content.offsetWidth)
  }

  function observeContent() {
    if (!observer || !content || observedContent === content) return
    if (observedContent) observer.unobserve(observedContent)
    observer.observe(content)
    observedContent = content
  }

  onMount(() => {
    mounted = true
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      if (container) observer.observe(container)
      observeContent()
    }
    return () => {
      mounted = false
      observer?.disconnect()
    }
  })

  $effect(() => {
    const currentText = text
    void tick().then(() => {
      if (!mounted || currentText !== text) return
      observeContent()
      measure()
    })
  })

  let cycleSeconds = $derived(scrollCycleSeconds(overflowPx))
</script>

<span
  {...rest}
  bind:this={container}
  data-scrolling-label=""
  data-overflowing={overflowPx > 0 ? '' : undefined}
  title={title ?? text}
  class={['tint-scrolling-label', className]}
>
  {#key text}
    <span
      bind:this={content}
      data-scrolling-label-content=""
      class="content"
      style={overflowPx > 0
        ? `--tint-scrolling-label-distance: ${overflowPx}px; --tint-scrolling-label-duration: ${cycleSeconds}s`
        : undefined}
    >{text}</span>
  {/key}
</span>

<style>
  .tint-scrolling-label { display: block; max-width: 100%; overflow: hidden; white-space: nowrap; }
  .content { display: inline-block; }
</style>
