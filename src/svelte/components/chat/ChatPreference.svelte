<script lang="ts">
  import { stripBidi } from '../../../core/chat'
  import ChatPart from './ChatPart.svelte'
  import type { ChatPreferenceProps } from './types'

  const NESTED_CONTROL = 'button, a, input, textarea, select, [role="button"]'
  let { title = 'Which response do you prefer?', subtitle = 'Your choice helps compare answer quality.',
    options, selectedOptionId, status = 'pending', onSelect, class: className,
    className: legacyClassName, ...rest }: ChatPreferenceProps = $props()
  let locked = $derived(status === 'selected')
  let selectedIndex = $derived(options.findIndex((option) => option.id === selectedOptionId))
  let focusIndex = $state(0)
  let group: HTMLDivElement | null = null

  $effect(() => {
    if (selectedIndex >= 0) focusIndex = selectedIndex
    else if (focusIndex >= options.length) focusIndex = Math.max(options.length - 1, 0)
  })

  function select(id: string) { if (!locked) onSelect?.(id) }
  function clickOption(event: MouseEvent, id: string, index: number) {
    if ((event.target as HTMLElement).closest(NESTED_CONTROL)) return
    focusIndex = index
    select(id)
  }
  function keyOption(event: KeyboardEvent, id: string, index: number) {
    if (locked || event.target !== event.currentTarget) return
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); select(id); return }
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!delta || options.length === 0) return
    event.preventDefault()
    focusIndex = (index + delta + options.length) % options.length
    group?.querySelectorAll<HTMLElement>('[role="radio"]')[focusIndex]?.focus()
  }
</script>

<section {...rest} data-chat-part="preference" data-status={status} class={['chat-preference space-y-3', className, legacyClassName]}>
  <header class="text-center"><h4 class="text-sm font-semibold text-tint-ink">{title}</h4>
    {#if subtitle}<p class="mt-1 text-xs text-tint-muted">{subtitle}</p>{/if}</header>
  <div bind:this={group} role="radiogroup" aria-label={title} aria-disabled={locked || undefined} class="chat-preference-options grid gap-3">
    {#each options as option, index (option.id)}
      {@const selected = selectedOptionId === option.id}
      <div role="radio" aria-checked={selected} aria-disabled={locked || undefined}
        tabindex={locked ? -1 : selectedIndex >= 0 ? selected ? 0 : -1 : index === focusIndex ? 0 : -1}
        onclick={(event) => clickOption(event, option.id, index)}
        onkeydown={(event) => keyOption(event, option.id, index)}
        onfocus={() => { focusIndex = index }}
        class={['min-w-0 rounded-xl border bg-tint-panel p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
          selected ? 'border-tint-accent shadow-[0_0_0_1px_var(--tint-accent)]' : 'border-tint-border hover:border-tint-accent/45 hover:bg-tint-surface',
          locked && !selected && 'opacity-70', !locked && 'cursor-pointer']}>
        <div class="mb-3 flex items-center gap-2 border-b border-tint-border pb-2">
          <span class={['grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold', selected ? 'bg-tint-accent text-tint-on-accent' : 'bg-tint-accent-soft text-tint-accent']} aria-hidden="true">{selected ? '✓' : index + 1}</span>
          <span class="min-w-0 flex-1 truncate text-xs font-semibold">{stripBidi(option.label)}</span>
        </div>
        <div class="space-y-3">
          {#each option.parts as part (part.id)}<ChatPart {part} />{/each}
        </div>
      </div>
    {/each}
  </div>
  {#if locked && selectedOptionId}<p class="flex items-center justify-center gap-1.5 text-xs font-medium text-tint-muted"><span aria-hidden="true" class="text-tint-success">✓</span>Preference recorded</p>{/if}
</section>

<style>
  .chat-preference { container-type: inline-size; }
  @container (min-width: 34rem) { .chat-preference-options { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
