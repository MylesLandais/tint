<script lang="ts">
  import { formDescribedBy, formatSliderValue } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: number
    onValueChange: (value: number) => void
    min?: number
    max?: number
    step?: number
  }

  let {
    id, label, value, onValueChange, description, error,
    disabled = false, min = 0, max = 1, step = 0.05,
  }: Props = $props()
</script>

<FormControl {id} {label} {description} {error} {disabled}>
  <div class="tint-svelte-slider">
    <input
      {id}
      type="range"
      {value}
      {min}
      {max}
      {step}
      {disabled}
      class="tint-svelte-slider__input"
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={formDescribedBy(id, description, error)}
      aria-valuetext={String(value)}
      oninput={(event) => onValueChange(Number(event.currentTarget.value))}
    />
    <output for={id}>{formatSliderValue(value)}</output>
  </div>
</FormControl>
