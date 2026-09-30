<script lang="ts">
  import Token from './Token.svelte'
  import type { ChoiceOption } from './types'
  import './styles.css'

  type Props = {
    id: string
    label: string
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
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
    /** Accept trimmed freeform entries on Enter, comma, or blur. */
    allowCustom?: boolean
  }

  let {
    id,
    label,
    selected,
    onSelectedChange,
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
    allowCustom = false,
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
  let showOptions = $derived(open && !disabled && (visibleOptions.length > 0 || !allowCustom))

  function commitCustom() {
    const next = query.trim()
    if (next && !selected.includes(next)) onSelectedChange([...selected, next])
    onQueryChange('')
  }

  function toggle(option: ChoiceOption) {
    if (option.disabled || disabled) return
    onSelectedChange(
      selected.includes(option.value)
        ? selected.filter((value) => value !== option.value)
        : [...selected, option.value],
    )
    onQueryChange('')
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
      toggle(activeOption)
    } else if (allowCustom && (event.key === 'Enter' || event.key === ',')) {
      event.preventDefault()
      commitCustom()
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      onOpenChange(false)
    } else if (event.key === 'Backspace' && !query && selected.length > 0) {
      onSelectedChange(selected.slice(0, -1))
    }
  }

  function handleFocusout(event: FocusEvent) {
    if (!event.relatedTarget || !root?.contains(event.relatedTarget as Node)) {
      if (allowCustom && query) commitCustom()
      if (open) onOpenChange(false)
    }
  }
</script>

<div class="tint-picker" data-invalid={Boolean(error)} data-disabled={disabled} bind:this={root} onfocusout={handleFocusout}>
  <label class="tint-field-label" for={id}>
    {label}{#if required}<span class="tint-field-required" aria-hidden="true"> *</span>{/if}
  </label>
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
  {#if selected.length > 0}
    <div class="tint-picker__tokens" role="group" aria-label={`Selected ${label}`}>
      {#each selected as selectedValue (selectedValue)}
        <Token
          label={options.find((option) => option.value === selectedValue)?.label ?? selectedValue}
          {disabled}
          onRemove={() => onSelectedChange(selected.filter((value) => value !== selectedValue))}
        />
      {/each}
    </div>
  {/if}
  <div class="tint-picker__control">
  <input
    {id}
    type="text"
    class="tint-field-input"
    role="combobox"
    autocomplete="off"
    aria-autocomplete="list"
    aria-haspopup="listbox"
    aria-expanded={showOptions}
    aria-controls={showOptions ? `${id}-options` : undefined}
    aria-activedescendant={showOptions && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
    aria-required={required}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={describedBy}
    value={query}
    {placeholder}
    {disabled}
    onfocus={() => { if (!open) onOpenChange(true) }}
    oninput={(event) => { activeValue = null; onQueryChange(event.currentTarget.value); if (!open) onOpenChange(true) }}
    onkeydown={handleKeydown}
  />
  {#if showOptions}
    <div id={`${id}-options`} class="tint-picker__options" role="listbox" aria-label={`${label} options`} aria-multiselectable="true">
      {#each visibleOptions as option, index (option.value)}
        <button
          id={`${id}-option-${index}`}
          type="button"
          role="option"
          tabindex="-1"
          class="tint-picker__option"
          data-active={activeOption?.value === option.value}
          aria-selected={selected.includes(option.value)}
          aria-disabled={option.disabled || undefined}
          disabled={option.disabled}
          onmousedown={(event) => event.preventDefault()}
          onclick={() => toggle(option)}
        >{option.label}</button>
      {:else}
        <p class="tint-picker__empty">{emptyMessage}</p>
      {/each}
    </div>
  {/if}
  </div>
  {#if error}<p id={`${id}-error`} class="tint-field-error" role="alert">{error}</p>{/if}
</div>
