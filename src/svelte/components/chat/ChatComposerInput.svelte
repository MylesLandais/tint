<script lang="ts">
  import type { ChatComposerInputProps } from './types'

  const MAX_HEIGHT = 160
  let { value, onValueChange, submitOnEnter = true, inputRef,
    class: className, ...rest }: ChatComposerInputProps = $props()
  let textarea: HTMLTextAreaElement | null = null

  function autosize() {
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
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
    if (!submitOnEnter || event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return
    event.preventDefault()
    ;(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit()
  }
</script>

<textarea use:register {...rest} {value} rows="1" oninput={(event) => onValueChange(event.currentTarget.value)} onkeydown={keydown}
  style:max-height={`${MAX_HEIGHT}px`} class={['min-h-7 w-full resize-none bg-transparent text-[0.9375rem] leading-6 outline-none placeholder:text-tint-muted', className]}></textarea>
