<script lang="ts">
  import type { FormFileValue } from '../../components/form/contracts/values'
  import {
    FormControl, TextAreaField, NumberField, PasswordField, SelectField,
    ToggleField, SliderField, FileField, TagsField,
  } from '../../svelte/form'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  let note = $state('A short note')
  let count = $state<number | ''>(3)
  let password = $state('')
  let genre = $state('ambient')
  let published = $state(false)
  let gain = $state(0.5)
  let file = $state<FormFileValue | null>(null)
  let tags = $state<string[]>(['ambient'])
  let custom = $state('')
  const genres = [
    { value: 'ambient', label: 'Ambient' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'jazz', label: 'Jazz' },
  ]
  const api: ApiRow[] = [
    { prop: 'FieldShared', type: 'id, label, description?, error?, required?, disabled?', description: 'Common label, help, validation, and state props.' },
    { prop: 'TextAreaField', type: 'value / onValueChange / rows', description: 'Controlled multiline text.' },
    { prop: 'NumberField', type: 'value / onValueChange / min / max / step', description: 'Controlled numeric input; empty emits an empty string.' },
    { prop: 'PasswordField', type: 'value / onValueChange / visible / onVisibleChange', description: 'Credential input with an accessible visibility toggle.' },
    { prop: 'SelectField', type: 'value / onValueChange / options', description: 'Native single selection.' },
    { prop: 'ToggleField', type: 'checked / onCheckedChange', description: 'Native controlled checkbox.' },
    { prop: 'SliderField', type: 'value / onValueChange / min / max / step', description: 'Native controlled range with a visible value.' },
    { prop: 'FileField', type: 'FormFileValue | null / onValueChange', description: 'File selection and optional image preview.' },
    { prop: 'TagsField', type: 'readonly string[] / onValueChange', description: 'Freeform tokens composed from Tokenizer.' },
    { prop: 'FormControl', type: 'id / label / children', description: 'Shared label, help, and error wrapper for custom controls.' },
  ]
  const usage = `import { TextAreaField, NumberField, ToggleField } from '@nebula/tint/form'
let note = $state('')
let count = $state(0)
let enabled = $state(false)

<TextAreaField id="note" label="Note" value={note}
  onValueChange={(next) => note = next} />
<NumberField id="count" label="Count" value={count}
  onValueChange={(next) => count = next} />
<ToggleField id="enabled" label="Enabled" checked={enabled}
  onCheckedChange={(next) => enabled = next} />`
</script>

<DocPage title="Form Fields" description="Controlled fields that share Tint's label, help, error, disabled, and required semantics." importPath="@nebula/tint/form" {usage} {api} accessibility="Labels connect to their controls. Descriptions and error messages use aria-describedby, invalid fields use aria-invalid, and disabled controls are native disabled inputs. The password visibility toggle is a separate named button.">
  <div class="fields">
    <TextAreaField id="gallery-note" label="Note" value={note} onValueChange={(next) => note = next} rows={3} />
    <NumberField id="gallery-count" label="Count" value={count} onValueChange={(next) => count = next} min={0} max={20} />
    <PasswordField id="gallery-password" label="Password" value={password} onValueChange={(next) => password = next} autocomplete="new-password" />
    <SelectField id="gallery-genre" label="Genre" value={genre} onValueChange={(next) => genre = next} options={genres} />
    <ToggleField id="gallery-published" label="Published" checked={published} onCheckedChange={(next) => published = next} />
    <SliderField id="gallery-gain" label="Gain" value={gain} onValueChange={(next) => gain = next} />
    <FileField id="gallery-file" label="Cover artwork" value={file} onValueChange={(next) => file = next} accept="image/*" />
    <TagsField id="gallery-tags" label="Tags" value={tags} onValueChange={(next) => tags = next} />
    <FormControl id="gallery-custom" label="Custom control" description="Use FormControl to label a native input.">
      <input id="gallery-custom" value={custom} oninput={(event) => custom = event.currentTarget.value} />
    </FormControl>
  </div>
  <p class="summary" aria-live="polite">Count: {count === '' ? 'empty' : count} · Published: {published ? 'yes' : 'no'} · Tags: {tags.join(', ') || 'none'}</p>
</DocPage>

<style>
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
  .fields > :global(*) { min-width: 0; }
  input { width: 100%; min-height: 2.5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .4rem .6rem; background: var(--tint-field); color: var(--tint-ink); }
  .summary { color: var(--tint-muted); font-size: .85rem; }
  @container (max-width: 720px) { .fields { grid-template-columns: 1fr; } }
</style>
