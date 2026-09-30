<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    autocomplete?: 'current-password' | 'new-password' | 'one-time-code' | 'off'
    visible?: boolean
    onVisibleChange?: (visible: boolean) => void
    showPasswordLabel?: string
    hidePasswordLabel?: string
    hasStoredValue?: boolean
    storedValueLabel?: string
    readOnly?: boolean
  }

  let {
    id, label, value, onValueChange, description, error,
    disabled = false, required = false, placeholder, autocomplete,
    visible, onVisibleChange,
    showPasswordLabel = 'Show password', hidePasswordLabel = 'Hide password',
    hasStoredValue = false,
    storedValueLabel = 'A value is stored. Leave blank to keep it.',
    readOnly = false,
  }: Props = $props()

  let localVisible = $state(false)
  let shown = $derived(visible ?? localVisible)
  let storedId = $derived(hasStoredValue ? `${id}-stored` : undefined)

  function toggleVisibility() {
    const next = !shown
    if (visible === undefined) localVisible = next
    onVisibleChange?.(next)
  }
</script>

<FormControl {id} {label} {description} {error} required={required && !hasStoredValue} {disabled}>
  <div class="tint-svelte-password">
    <input
      {id}
      type={shown ? 'text' : 'password'}
      class="tint-field-input"
      {value}
      {placeholder}
      {autocomplete}
      required={required && !hasStoredValue}
      {disabled}
      readonly={readOnly}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={formDescribedBy(id, description, error, storedId)}
      oninput={(event) => onValueChange(event.currentTarget.value)}
    />
    <button
      type="button"
      class="tint-svelte-password__toggle"
      aria-label={shown ? hidePasswordLabel : showPasswordLabel}
      aria-pressed={shown}
      {disabled}
      onclick={toggleVisibility}
    >{shown ? hidePasswordLabel : showPasswordLabel}</button>
  </div>
  {#if hasStoredValue}<p id={storedId} class="tint-field-description">{storedValueLabel}</p>{/if}
</FormControl>
