<script lang="ts">
  import Button from '../../svelte/components/button/Button.svelte'
  import { TintFluidForm, TextField, Typeahead, Tokenizer, type ChoiceOption } from '../../svelte/form'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  const options: ChoiceOption[] = [
    { value: 'ambient', label: 'Ambient' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'jazz', label: 'Jazz' },
  ]
  let name = $state('New collection')
  let genre = $state('')
  let genreQuery = $state('')
  let genreOpen = $state(false)
  let tags = $state<string[]>(['ambient'])
  let tagQuery = $state('')
  let tagsOpen = $state(false)
  let submitted = $state(false)
  const api: ApiRow[] = [
    { prop: 'TintFluidForm.columns', type: '1 | 2', description: 'Container-aware field columns.' },
    { prop: 'FormLayout.schema / values', type: 'FormSchema / FormValues', description: 'The schema to render and the current host-owned form values.' },
    { prop: 'onValuesChange', type: '(values: FormValues) => void', description: 'Emits the next values after a field edit; the host supplies them back.' },
    { prop: 'issues / error', type: 'readonly FormIssue[] / string', description: 'Server or host validation issues and an optional form-level error banner.' },
    { prop: 'busy / disabled / readOnly', type: 'boolean', description: 'Lock submission and field editing while work is pending or access is restricted.' },
    { prop: 'density / className', type: "'compact' | 'comfortable' / string", description: 'Field spacing and an optional class on the form surface.' },
    { prop: 'submitLabel / submittingLabel / hideSubmit', type: 'string / string / boolean', description: 'Labels for the submit button, or suppression when the host renders its own action.' },
    { prop: 'transport', type: 'FormTransport<FormValues, unknown>', description: 'Optional remote validation and submission transport; in-flight work is aborted on teardown.' },
    { prop: 'onSubmit / onSubmitError', type: 'callbacks', description: 'Receives the validated submit envelope or an error from transport/submission.' },
    { prop: 'onValidation', type: '(issues: readonly FormIssue[]) => void', description: 'Receives each local or remote validation result.' },
    { prop: 'TextField.value', type: 'string', description: 'Current host-owned field value.' },
    { prop: 'onValueChange', type: '(value: string) => void', description: 'Intent emitted when a field changes.' },
    { prop: 'Typeahead.query / open', type: 'string / boolean', description: 'Host-owned picker input and visibility.' },
    { prop: 'Tokenizer.selected', type: 'readonly string[]', description: 'Host-owned multi-selection.' },
  ]
  const usage = `import { TintFluidForm, TextField } from '@nebula/tint/form'
let name = $state('')

<TintFluidForm title="Collection" columns={2}>
  <TextField id="name" label="Name" value={name}
    onValueChange={(next) => name = next} required />
</TintFluidForm>`
</script>

<DocPage title="Fluid Form" description="Carbon-backed field behavior with Tint's controlled state and semantic styling." importPath="@nebula/tint/form" {usage} {api} accessibility="Labels remain associated with inputs. Required and invalid states are visible and announced; Typeahead and Tokenizer expose combobox/listbox keyboard behavior. The host owns values and submit handling.">
  <TintFluidForm id="docs-form" title="New collection" description="Change the fields and submit the controlled form." columns={2} onsubmit={(event) => { event.preventDefault(); submitted = true }}>
    <TextField id="docs-name" label="Collection name" value={name} onValueChange={(next) => name = next} required error={name ? undefined : 'Enter a name.'} />
    <Typeahead id="docs-genre" label="Primary genre" value={genre} onValueChange={(next) => genre = next} query={genreQuery} onQueryChange={(next) => genreQuery = next} open={genreOpen} onOpenChange={(next) => genreOpen = next} {options} />
    <Tokenizer id="docs-tags" label="Tags" selected={tags} onSelectedChange={(next) => tags = next} query={tagQuery} onQueryChange={(next) => tagQuery = next} open={tagsOpen} onOpenChange={(next) => tagsOpen = next} {options} />
    <div class="form-action"><Button type="submit" variant="primary">Save</Button><span aria-live="polite">{submitted ? `Saved ${name}` : 'Ready to save'}</span></div>
  </TintFluidForm>
</DocPage>

<style>.form-action { display: flex; align-items: center; gap: .75rem; padding-block: .5rem; color: var(--tint-muted); font-size: .84rem; }</style>
