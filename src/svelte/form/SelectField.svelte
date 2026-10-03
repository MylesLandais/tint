<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import Select from './Select.svelte'
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
  <Select
    {id}
    class="tint-field-input"
    {value}
    {required}
    {disabled}
    {options}
    invalid={Boolean(error)}
    aria-describedby={formDescribedBy(id, description, error)}
    onValueChange={onValueChange}
  />
</FormControl>
