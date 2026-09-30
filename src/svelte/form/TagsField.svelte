<script lang="ts">
  import Tokenizer from './Tokenizer.svelte'
  import type { FieldShared } from './types'

  type Props = FieldShared & {
    value: readonly string[]
    onValueChange: (value: string[]) => void
    placeholder?: string
  }

  let {
    id, label, value, onValueChange, placeholder,
    description, error, disabled = false, required = false,
  }: Props = $props()

  let query = $state('')
  let open = $state(false)
</script>

<Tokenizer
  {id}
  {label}
  selected={value}
  onSelectedChange={onValueChange}
  {query}
  onQueryChange={(next) => query = next}
  {open}
  onOpenChange={(next) => open = next}
  options={[]}
  allowCustom
  {description}
  {error}
  {disabled}
  {required}
  {placeholder}
/>
