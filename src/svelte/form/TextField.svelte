<script lang="ts">
  import { TextInput } from 'carbon-components-svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import './styles.css'

  type Props = {
    class?: string
    id: string
    label: string
    value: string
    onValueChange: (value: string) => void
    description?: string
    /** ID of additional host-rendered help text. */
    describedBy?: string
    error?: string
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
    /** Native UTF-16 input bound; host-provided values are never truncated. */
    maxLength?: number
    placeholder?: string
    name?: string
    autocomplete?: HTMLInputAttributes['autocomplete']
    inputmode?: HTMLInputAttributes['inputmode']
    spellcheck?: HTMLInputAttributes['spellcheck']
    /** Native input event; the host may prevent its default form action. */
    onkeydown?: (event: KeyboardEvent) => void
  }

  let {
    class: className,
    id,
    label,
    value,
    onValueChange,
    description,
    describedBy: additionalDescription,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    type = 'text',
    maxLength,
    placeholder,
    name,
    autocomplete,
    inputmode,
    spellcheck,
    onkeydown,
  }: Props = $props()

  let describedBy = $derived(
    [description && `${id}-description`, error && `error-${id}`, additionalDescription].filter(Boolean).join(' ') || undefined,
  )
</script>

<div class={['tint-text-field', className]} data-invalid={Boolean(error)} data-disabled={disabled} data-required={required}>
  <TextInput
    {id}
    {name}
    {type}
    {value}
    {placeholder}
    maxlength={maxLength}
    {autocomplete}
    {inputmode}
    {spellcheck}
    {required}
    {disabled}
    readonly={readOnly}
    labelText={label}
    invalid={Boolean(error)}
    invalidText={error ?? ''}
    aria-describedby={describedBy}
    on:keydown={(event) => onkeydown?.(event)}
    on:input={(event) => onValueChange(String(event.detail ?? ''))}
  />
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
</div>
