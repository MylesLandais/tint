<script lang="ts">
  import type { FormFileValue } from '../../core/form/contracts/values'
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: FormFileValue | null
    onValueChange: (value: FormFileValue | null) => void
    accept?: string
  }

  let {
    id, label, value, onValueChange, accept, description, error,
    disabled = false, required = false,
  }: Props = $props()

  let preview = $derived(value?.mimeType?.startsWith('image/') ? value.objectUrl : undefined)

  function setFile(file: File | undefined) {
    if (value?.objectUrl) URL.revokeObjectURL(value.objectUrl)
    if (!file) {
      onValueChange(null)
      return
    }
    onValueChange({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      objectUrl: URL.createObjectURL(file),
    })
  }
</script>

<FormControl {id} {label} {description} {error} {disabled} {required}>
  <div class="tint-svelte-file">
    {#if preview}<img src={preview} alt="" class="tint-svelte-file__preview" />{/if}
    <input
      {id}
      type="file"
      {accept}
      {disabled}
      required={required && !value}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={formDescribedBy(id, description, error)}
      onchange={(event) => setFile(event.currentTarget.files?.[0])}
    />
    {#if value}
      <p class="tint-svelte-file__name">
        {value.name}
        <button type="button" disabled={disabled} onclick={() => setFile(undefined)}>Remove {value.name}</button>
      </p>
    {/if}
  </div>
</FormControl>
