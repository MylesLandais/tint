<script lang="ts">
  import type { ChatComposerInputProps, ChatInputHighlight } from './types'

  const MAX_HEIGHT = 160
  let { value, onValueChange, submitOnEnter = true, inputRef, onInputKeydown, highlights = [],
    class: className, ...rest }: ChatComposerInputProps = $props()
  let textarea: HTMLTextAreaElement | null = null
  let mirror = $state<HTMLDivElement | null>(null)

  // Plain text runs and marked runs, in order. Overlapping or out-of-range
  // highlights are clipped rather than trusted.
  type Run = { text: string; tone?: string; marked: boolean }
  let runs = $derived.by(() => {
    const sorted = [...highlights].sort((a, b) => a.start - b.start)
    const out: Run[] = []
    let at = 0
    for (const mark of sorted as ChatInputHighlight[]) {
      const start = Math.max(at, Math.min(mark.start, value.length))
      const end = Math.max(start, Math.min(mark.end, value.length))
      if (start > at) out.push({ text: value.slice(at, start), marked: false })
      if (end > start) out.push({ text: value.slice(start, end), tone: mark.tone, marked: true })
      at = end
    }
    if (at < value.length) out.push({ text: value.slice(at), marked: false })
    return out
  })
  let marked = $derived(runs.some((run) => run.marked))

  function autosize() {
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
    syncScroll()
  }

  function syncScroll() {
    if (textarea && mirror) mirror.scrollTop = textarea.scrollTop
  }

  $effect(() => { void value; autosize() })

  function register(node: HTMLTextAreaElement) {
    textarea = node
    inputRef?.(node)
    autosize()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(autosize)
    observer?.observe(node)
    return { destroy: () => { observer?.disconnect(); textarea = null; inputRef?.(null) } }
  }

  function keydown(event: KeyboardEvent) {
    onInputKeydown?.(event)
    if (event.defaultPrevented) return
    if (!submitOnEnter || event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return
    event.preventDefault()
    ;(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit()
  }
</script>

<div data-chat-composer-field="" class="relative">
  {#if marked}
    <!-- Same box and typography as the textarea; only the marks are visible. -->
    <div bind:this={mirror} aria-hidden="true" data-chat-composer-mirror=""
      class={['pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-[0.9375rem] leading-6 text-transparent', className]}
      >{#each runs as run, index (index)}{#if run.marked}<mark data-tone={run.tone}
        class="rounded-[0.3rem] bg-[color-mix(in_srgb,var(--tint-accent)_22%,transparent)] text-transparent shadow-[0_0_0_1px_color-mix(in_srgb,var(--tint-accent)_45%,transparent)]">{run.text}</mark>{:else}{run.text}{/if}{/each}{'\n'}</div>
  {/if}
  <textarea use:register {...rest} {value} rows="1" oninput={(event) => onValueChange(event.currentTarget.value)} onkeydown={keydown} onscroll={syncScroll}
    style:max-height={`${MAX_HEIGHT}px`} class={['relative min-h-7 w-full resize-none bg-transparent text-[0.9375rem] leading-6 outline-none placeholder:text-tint-muted', className]}></textarea>
</div>
