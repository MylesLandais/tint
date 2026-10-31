<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    hideLabel?: boolean
    inline?: boolean
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }

  let {
    id, label, hideLabel = false, inline = false, checked, onCheckedChange, description, error, disabled = false,
  }: Props = $props()
</script>

<FormControl {id} {label} {hideLabel} {inline} {description} {error} {disabled}>
  <input
    {id}
    type="checkbox"
    class="tint-svelte-checkbox"
    {checked}
    {disabled}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={formDescribedBy(id, description, error)}
    onchange={(event) => {
      const input = event.currentTarget
      onCheckedChange(input.checked)
      input.checked = checked
    }}
  />
</FormControl>
