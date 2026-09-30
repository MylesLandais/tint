<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: number | string
    onValueChange: (value: number | '') => void
    min?: number
    max?: number
    step?: number | 'any'
    readOnly?: boolean
  }

  let {
    id, label, value, onValueChange, description, error,
    disabled = false, required = false, min, max, step, readOnly = false,
  }: Props = $props()
</script>

<FormControl {id} {label} {description} {error} {required} {disabled}>
  <input
    {id}
    type="number"
    class="tint-field-input"
    {value}
    {min}
    {max}
    {step}
    {required}
    {disabled}
    readonly={readOnly}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={formDescribedBy(id, description, error)}
    oninput={(event) => onValueChange(event.currentTarget.value === '' ? '' : Number(event.currentTarget.value))}
  />
</FormControl>
