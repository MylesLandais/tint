<script lang="ts">
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    hideLabel?: boolean
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }

  let {
    id, label, hideLabel = false, checked, onCheckedChange, description, error, disabled = false,
  }: Props = $props()
</script>

<FormControl {id} {label} {hideLabel} {description} {error} {disabled}>
  <input
    {id}
    type="checkbox"
    class="tint-svelte-checkbox"
    {checked}
    {disabled}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={formDescribedBy(id, description, error)}
    onchange={(event) => onCheckedChange(event.currentTarget.checked)}
  />
</FormControl>
