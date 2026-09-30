<script lang="ts">
  import { TextInput } from 'carbon-components-svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import './styles.css'

  type Props = {
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
    placeholder?: string
    name?: string
    autocomplete?: HTMLInputAttributes['autocomplete']
  }

  let {
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
    placeholder,
    name,
    autocomplete,
  }: Props = $props()

  let describedBy = $derived(
    [description && `${id}-description`, error && `error-${id}`, additionalDescription].filter(Boolean).join(' ') || undefined,
  )
</script>

<div class="tint-text-field" data-invalid={Boolean(error)} data-disabled={disabled} data-required={required}>
  <TextInput
    {id}
    {name}
    {type}
    {value}
    {placeholder}
    {autocomplete}
    {required}
    {disabled}
    readonly={readOnly}
    labelText={label}
    invalid={Boolean(error)}
    invalidText={error ?? ''}
    aria-describedby={describedBy}
    on:input={(event) => onValueChange(String(event.detail ?? ''))}
  />
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
</div>
