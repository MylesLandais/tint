<script lang="ts">
  import type { ChoiceOption } from './types'
  import './styles.css'

  type Props = {
    id: string
    label: string
    value: string
    onValueChange: (value: string) => void
    query: string
    onQueryChange: (query: string) => void
    open: boolean
    onOpenChange: (open: boolean) => void
    options: readonly ChoiceOption[]
    description?: string
    error?: string
    disabled?: boolean
    required?: boolean
    placeholder?: string
    emptyMessage?: string
  }

  let {
    id,
    label,
    value,
    onValueChange,
    query,
    onQueryChange,
    open,
    onOpenChange,
    options,
    description,
    error,
    disabled = false,
    required = false,
    placeholder,
    emptyMessage = 'No matching options',
  }: Props = $props()

  let root = $state<HTMLDivElement>()
  let activeValue = $state<string | null>(null)
  let visibleOptions = $derived(
    options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
  )
  let enabledOptions = $derived(visibleOptions.filter((option) => !option.disabled))
  let activeOption = $derived(enabledOptions.find((option) => option.value === activeValue) ?? enabledOptions[0])
  let activeIndex = $derived(visibleOptions.findIndex((option) => option.value === activeOption?.value))
  let describedBy = $derived(
    [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined,
  )

  function choose(option: ChoiceOption) {
    if (option.disabled || disabled) return
    onValueChange(option.value)
    onQueryChange(option.label)
    onOpenChange(false)
  }

  function move(direction: -1 | 1) {
    if (enabledOptions.length === 0) return
    const index = enabledOptions.findIndex((option) => option.value === activeOption?.value)
    activeValue = enabledOptions[Math.max(0, Math.min(enabledOptions.length - 1, index + direction))].value
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) onOpenChange(true)
      else move(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      activeValue = enabledOptions[0]?.value ?? null
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      activeValue = enabledOptions.at(-1)?.value ?? null
    } else if (event.key === 'Enter' && open && activeOption) {
      event.preventDefault()
      choose(activeOption)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      onOpenChange(false)
    }
  }

  function handleFocusout(event: FocusEvent) {
    if (open && (!event.relatedTarget || !root?.contains(event.relatedTarget as Node))) onOpenChange(false)
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const nextQuery = event.currentTarget.value
    activeValue = null
    onQueryChange(nextQuery)
    if (value && nextQuery !== options.find((option) => option.value === value)?.label) onValueChange('')
    if (!open) onOpenChange(true)
  }
</script>

<div class="tint-picker" data-invalid={Boolean(error)} data-disabled={disabled} bind:this={root} onfocusout={handleFocusout}>
  <label class="tint-field-label" for={id}>
    {label}{#if required}<span class="tint-field-required" aria-hidden="true"> *</span>{/if}
  </label>
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
  <div class="tint-picker__control">
  <input
    {id}
    type="text"
    class="tint-field-input"
    role="combobox"
    autocomplete="off"
    aria-autocomplete="list"
    aria-haspopup="listbox"
    aria-expanded={open && !disabled}
    aria-controls={open && !disabled ? `${id}-options` : undefined}
    aria-activedescendant={open && !disabled && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
    aria-required={required}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={describedBy}
    value={query}
    {placeholder}
    {disabled}
    onfocus={() => { if (!open) onOpenChange(true) }}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if open && !disabled}
    <div id={`${id}-options`} class="tint-picker__options" role="listbox" aria-label={`${label} options`}>
      {#each visibleOptions as option, index (option.value)}
        <button
          id={`${id}-option-${index}`}
          type="button"
          role="option"
          tabindex="-1"
          class="tint-picker__option"
          data-active={activeOption?.value === option.value}
          aria-selected={value === option.value}
          aria-disabled={option.disabled || undefined}
          disabled={option.disabled}
          onmousedown={(event) => event.preventDefault()}
          onclick={() => choose(option)}
        >{option.label}</button>
      {:else}
        <p class="tint-picker__empty">{emptyMessage}</p>
      {/each}
    </div>
  {/if}
  </div>
  {#if error}<p id={`${id}-error`} class="tint-field-error" role="alert">{error}</p>{/if}
</div>
