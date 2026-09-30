<script lang="ts">
  import { TextArea } from 'carbon-components-svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    rows?: number
    readOnly?: boolean
  }

  let {
    id, label, value, onValueChange, description, error,
    disabled = false, required = false, placeholder, rows = 4, readOnly = false,
  }: Props = $props()

  let describedBy = $derived(
    [description && `${id}-description`, error && `error-${id}`].filter(Boolean).join(' ') || undefined,
  )
</script>

<div class="tint-text-field tint-svelte-textarea" data-invalid={Boolean(error)} data-disabled={disabled} data-required={required}>
  <TextArea
    {id}
    {value}
    {placeholder}
    {rows}
    {disabled}
    {required}
    readonly={readOnly}
    labelText={label}
    invalid={Boolean(error)}
    invalidText={error ?? ''}
    aria-describedby={describedBy}
    on:input={(event) => onValueChange((event.target as HTMLTextAreaElement).value)}
  />
  {#if description}<p id={`${id}-description`} class="tint-field-description">{description}</p>{/if}
</div>
