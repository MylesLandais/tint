<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import { Check, Search } from '@lucide/svelte'
  import { filterSettings, groupSettings, type SettingsItem } from '../../../core/media/settings'
  import Icon from '../icon/Icon.svelte'
  import Popover from '../popover/Popover.svelte'
  import type { PopoverTriggerProps } from '../popover/types'

  type Props = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    items: readonly SettingsItem[]
    value?: string
    onSelect?: (id: string) => void
    label?: string
    placeholder?: string
    footer?: string | Snippet
    emptySearchText?: string | Snippet
    onQueryChange?: (query: string) => void
    trigger?: Snippet<[PopoverTriggerProps]>
    class?: string
  }
  let {
    isOpen, onOpenChange, items, value, onSelect,
    label = 'Settings', placeholder = 'Search settings…', footer,
    emptySearchText = 'No results', onQueryChange, trigger, class: className,
  }: Props = $props()
  const listId = $props.id()
  let triggerHolder = $state<HTMLSpanElement>()
  let query = $state('')
  let activeIndex = $state(0)
  let wasOpen = false
  let filtered = $derived(filterSettings(items, query))
  let groups = $derived(groupSettings(filtered))
  let flat = $derived(groups.flatMap((group) => group.items))

  $effect(() => {
    if (isOpen && !wasOpen) {
      query = ''
      activeIndex = Math.max(0, flat.findIndex((item) => item.id === value))
      wasOpen = true
    } else if (!isOpen) {
      wasOpen = false
      query = ''
      activeIndex = 0
    }
  })

  function closeAndFocus() {
    onOpenChange(false)
    void tick().then(() => triggerHolder?.querySelector<HTMLElement>('[data-tint-trigger]')?.focus())
  }

  function select(id: string) {
    onSelect?.(id)
    closeAndFocus()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      activeIndex = flat.length ? (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length : 0
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      activeIndex = event.key === 'Home' ? 0 : Math.max(flat.length - 1, 0)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[activeIndex]
      if (item) select(item.id)
    }
  }
</script>

{#snippet forwardedTrigger(triggerProps: PopoverTriggerProps)}
  <span bind:this={triggerHolder} class="trigger-holder">
    {#if trigger}
      {@render trigger(triggerProps)}
    {:else}
      <button id={triggerProps.id} type="button" data-tint-trigger="" aria-haspopup={triggerProps['aria-haspopup']} aria-expanded={triggerProps['aria-expanded']} aria-controls={triggerProps['aria-controls']} onclick={triggerProps.onclick}>{label}</button>
    {/if}
  </span>
{/snippet}

<Popover open={isOpen} {onOpenChange} trigger={forwardedTrigger} {label} side="top" class={['tint-settings-popout', className].filter(Boolean).join(' ')}>
  <div class="search-row"><Icon icon={Search} size="sm" /><input
    role="combobox"
    aria-label={`Search ${label}`}
    aria-expanded="true"
    aria-controls={listId}
    aria-autocomplete="list"
    aria-activedescendant={flat[activeIndex] ? `${listId}-${flat[activeIndex].id}` : undefined}
    {placeholder}
    value={query}
    oninput={(event) => { query = event.currentTarget.value; activeIndex = 0; onQueryChange?.(query) }}
    onkeydown={onKeydown}
  /></div>
  <div id={listId} role="listbox" aria-label={label} class="list">
    {#if flat.length === 0}
      <div class="empty">{#if typeof emptySearchText === 'string'}{emptySearchText}{:else}{@render emptySearchText()}{/if}</div>
    {:else}
      {#each groups as group (group.heading ?? 'ungrouped')}
        <div class="group">
          {#if group.heading}<div class="heading">{group.heading}</div>{/if}
          {#each group.items as item (item.id)}
            {@const index = flat.findIndex((candidate) => candidate.id === item.id)}
            <button
              id={`${listId}-${item.id}`}
              type="button"
              role="option"
              aria-selected={item.id === value}
              data-active={index === activeIndex}
              onpointerenter={() => activeIndex = index}
              onclick={() => select(item.id)}
            >
              <span class="item-label">{item.label}</span>
              {#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
              {#if item.id === value}<Icon icon={Check} size="sm" />{/if}
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
  <div class="footer">{#if footer}{#if typeof footer === 'string'}{footer}{:else}{@render footer()}{/if}{:else}↑ ↓ navigate · ↵ select · esc close{/if}</div>
</Popover>

<style>
  .trigger-holder { display: inline-flex; }
  .trigger-holder button { border: 0; border-radius: var(--tint-radius-sm); padding: var(--tint-space-2); background: transparent; color: var(--tint-chrome-ink); cursor: pointer; }
  :global(.tint-settings-popout) { width: 18rem !important; max-width: min(20rem, calc(100vw - 1rem)) !important; padding: 0 !important; border-color: var(--tint-chrome-border) !important; background: var(--tint-chrome) !important; color: var(--tint-chrome-ink) !important; }
  .search-row { display: flex; align-items: center; gap: .5rem; padding: .625rem .75rem; border-bottom: 1px solid var(--tint-chrome-border); }
  .search-row:focus-within { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  input { min-width: 0; width: 100%; border: 0; background: transparent; color: inherit; font: inherit; font-size: var(--tint-font-size-sm); outline: none; }
  input::placeholder { color: color-mix(in srgb, var(--tint-chrome-ink) 40%, transparent); }
  .list { max-height: 16rem; overflow: auto; padding: .375rem; }
  .group + .group { margin-top: .25rem; }
  .heading { padding: .375rem .625rem .25rem; color: color-mix(in srgb, var(--tint-chrome-ink) 55%, transparent); font-size: .6875rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
  .group button { display: flex; width: 100%; align-items: center; gap: .5rem; padding: .5rem .625rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: inherit; font: inherit; font-size: var(--tint-font-size-sm); text-align: left; cursor: pointer; }
  .group button:hover, .group button[data-active='true'] { background: color-mix(in srgb, var(--tint-chrome-ink) 12%, transparent); }
  .group button:focus-visible { outline: 2px solid var(--tint-chrome-ink); }
  .item-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  kbd { border-radius: var(--tint-radius-sm); padding: .125rem .375rem; background: color-mix(in srgb, var(--tint-chrome-ink) 10%, transparent); font-size: .6875rem; }
  .empty { padding: 1.5rem .75rem; color: color-mix(in srgb, var(--tint-chrome-ink) 55%, transparent); text-align: center; }
  .footer { border-top: 1px solid var(--tint-chrome-border); padding: .5rem .75rem; color: color-mix(in srgb, var(--tint-chrome-ink) 55%, transparent); font-size: .6875rem; }
</style>
