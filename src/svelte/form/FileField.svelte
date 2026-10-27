<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { FormFileValue } from '../../core/form/contracts/values'
  import { formDescribedBy } from '../../core/form/render'
  import FormControl from './FormControl.svelte'
  import type { FieldShared } from './types'
  import './styles.css'

  type Props = FieldShared & {
    value: FormFileValue | null
    onValueChange: (value: FormFileValue | null) => void
    accept?: string
    /** Original browser file for host-owned encoding/upload; never included in form metadata. */
    onFileChange?: (file: File | null) => void
  }

  let {
    id, label, value, onValueChange, onFileChange, accept, description, error,
    disabled = false, required = false,
  }: Props = $props()

  let alive = true
  let created = $state<string | null>(null)
  const ownedUrls = new Set<string>()
  onDestroy(() => { alive = false; for (const url of ownedUrls) URL.revokeObjectURL(url); ownedUrls.clear() })
  $effect(() => {
    // Host-provided previews may be shared elsewhere; only release URLs created here.
    void created
    for (const url of ownedUrls) if (url !== value?.objectUrl) { URL.revokeObjectURL(url); ownedUrls.delete(url) }
  })
  let preview = $derived(value?.mimeType?.startsWith('image/') ? value.objectUrl : undefined)

  function setFile(file: File | undefined) {
    if (!alive || disabled) return
    if (!file) {
      onValueChange(null)
      if (alive) onFileChange?.(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    ownedUrls.add(objectUrl)
    created = objectUrl
    onValueChange({ name: file.name, mimeType: file.type || 'application/octet-stream', objectUrl })
    if (alive) onFileChange?.(file)
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
      onchange={(event) => { setFile(event.currentTarget.files?.[0]); event.currentTarget.value = '' }}
    />
    {#if value}
      <p class="tint-svelte-file__name">
        {value.name}
        <button type="button" disabled={disabled} onclick={() => setFile(undefined)}>Remove {value.name}</button>
      </p>
    {/if}
  </div>
</FormControl>
