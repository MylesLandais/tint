<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { ChoiceOption, FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: string
    onValueChange: (value: string) => void
    options: readonly ChoiceOption[]
  }

  let {
    id, label, value, onValueChange, options, description, error,
    disabled = false, required = false,
  }: Props = $props()
</script>

<FormControl {id} {label} {description} {error} {required} {disabled}>
  <select
    {id}
    class="tint-field-input"
    {value}
    {required}
    {disabled}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={formDescribedBy(id, description, error)}
    onchange={(event) => onValueChange(event.currentTarget.value)}
  >
    {#each options as option (option.value)}
      <option value={option.value} disabled={option.disabled}>{option.label}</option>
    {/each}
  </select>
</FormControl>
