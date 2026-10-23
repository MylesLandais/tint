<script lang="ts">
  import type { FormFileValue } from '../../components/form/contracts/values'
  import {
    FormControl, TextField, TextAreaField, NumberField, PasswordField, SelectField,
    ToggleField, SliderField, FileField, TagsField,
  } from '../../svelte/form'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  let search = $state('')
  let service = $state('custom-service')
  let note = $state('A short note')
  let count = $state<number | ''>(3)
  let password = $state('')
  let genre = $state('ambient')
  let published = $state(false)
  let gain = $state(0.5)
  let fit = $state(1)
  let file = $state<FormFileValue | null>(null)
  let tags = $state<string[]>(['ambient'])
  let custom = $state('')
  const genres = [
    { value: 'ambient', label: 'Ambient' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'jazz', label: 'Jazz' },
  ]
  const api: ApiRow[] = [
    { prop: 'SliderField.formatValue', type: '(value: number) => string', description: 'Optional visible and accessible value text, such as 100%. The input bounds, step, value and callback remain numeric; omitted formatting preserves the existing defaults.' },
    { prop: 'FieldShared', type: 'id, label, description?, error?, required?, disabled?', description: 'Common label, help, validation, and state props.' },
    { prop: 'TextField', type: 'value / onValueChange / maxLength? / list?', description: 'Optional native input length bound and host datalist ID. Suggestions do not restrict values or select one automatically; existing host values are never truncated.' },
    { prop: 'TextAreaField', type: 'value / onValueChange / rows / spellcheck', description: 'Controlled multiline text. Native spellcheck is optional; omit it to inherit the browser setting or set false for source and structured data.' },
    { prop: 'NumberField', type: 'value / onValueChange / min / max / step', description: 'Controlled numeric input; empty emits an empty string.' },
    { prop: 'PasswordField', type: 'value / onValueChange / visible / onVisibleChange', description: 'Credential input with an accessible visibility toggle.' },
    { prop: 'SelectField', type: 'value / onValueChange / options', description: 'Native single selection with a themed menu: the closed control and the open list both resolve from the active theme.' },
    { prop: 'Select', type: "value / onValueChange / options | children / size: 'md' | 'sm' / invalid", description: 'The bare native select used by SelectField, for toolbars and compact menus. Any <select class="tint-select"> gets the same chrome.' },
    { prop: 'ToggleField', type: 'checked / onCheckedChange', description: 'Native controlled checkbox. inline places the checkbox beside its label for toolbars. hideLabel visually hides its label while retaining its accessible name, for compact table selection.' },
    { prop: 'SliderField', type: 'value / onValueChange / min / max / step', description: 'Native controlled range with a visible value.' },
    { prop: 'FileField', type: 'FormFileValue | null / onValueChange', description: 'File selection and optional image preview.' },
    { prop: 'TagsField', type: 'readonly string[] / onValueChange', description: 'Freeform tokens composed from Tokenizer.' },
    { prop: 'FormControl', type: 'id / label / children', description: 'Shared label, help, and error wrapper for custom controls; hideLabel retains a visually hidden label.' },
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

<DocPage title="Form Fields" description="Controlled fields that share Tint's label, help, error, disabled, and required semantics." importPath="@nebula/tint/form" {usage} {api} accessibility="Select menus keep native semantics, keyboard (arrows, Home, End, type-ahead) and screen-reader behavior. The control boundary, chevron and focus ring meet 3:1 and the option text 4.5:1 in every theme and scheme, which the theme tests enforce; the open list is painted from the same tokens, and forced-colors mode falls back to system colors. Labels connect to their controls. Descriptions and error messages use aria-describedby, invalid fields use aria-invalid, and disabled controls are native disabled inputs. The password visibility toggle is a separate named button.">
  <div class="fields">
    <TextField id="gallery-search" label="Bounded search" type="search" value={search} onValueChange={(next) => search = next} maxLength={256} description="Up to 256 UTF-16 code units, enforced by the native input." />
    <TextField id="gallery-service" label="Service suggestions" value={service} list="gallery-service-options" onValueChange={(next) => service = next} description="Choose a native suggestion or enter a custom service name." />
    <datalist id="gallery-service-options"><option value="local-service"></option><option value="remote-service"></option></datalist>
    <TextAreaField id="gallery-note" label="Note" value={note} onValueChange={(next) => note = next} rows={3} />
    <NumberField id="gallery-count" label="Count" value={count} onValueChange={(next) => count = next} min={0} max={20} />
    <PasswordField id="gallery-password" label="Password" value={password} onValueChange={(next) => password = next} autocomplete="new-password" />
    <SelectField id="gallery-genre" label="Genre" value={genre} onValueChange={(next) => genre = next} options={genres} />
    <SelectField id="gallery-genre-error" label="Genre (invalid)" value="" onValueChange={() => {}} options={[{ value: '', label: 'Choose a genre' }, ...genres]} error="Choose a genre" required />
    <SelectField id="gallery-genre-disabled" label="Genre (disabled)" value={genre} onValueChange={() => {}} options={genres} disabled />
    <ToggleField id="gallery-published" label="Published" checked={published} onCheckedChange={(next) => published = next} />
    <SliderField id="gallery-gain" label="Gain" value={gain} onValueChange={(next) => gain = next} />
    <SliderField id="gallery-fit" label="Fit scale" value={fit} onValueChange={(next) => fit = next} min={0.8} max={1.2} step={0.05} formatValue={(value) => `${Math.round(value * 100)}%`} />
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
