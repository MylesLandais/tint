<script lang="ts">
  import type { CharacterDocument } from '../../../core/character-card/document'
  import {
    CHARACTER_DOCUMENT_FORM_SCHEMA,
    characterDocumentFormValues,
    characterDocumentFromFormValues,
    hasCharacterDataEnvelope,
  } from '../../../core/character-card/document'
  import type { FormValues } from '../../form'
  import FormLayout from '../../form/FormLayout.svelte'
  import './library.css'

  type Props = {
    value: CharacterDocument
    onValueChange: (value: CharacterDocument) => void
    onSubmit: (value: CharacterDocument) => void | Promise<void>
    busy?: boolean
    error?: string
  }

  let { value, onValueChange, onSubmit, busy = false, error }: Props = $props()
  let section = $state('content')
  let enveloped = $derived(hasCharacterDataEnvelope(value))
  let values = $derived(characterDocumentFormValues(value))
  let visibleSchema = $derived({
    ...CHARACTER_DOCUMENT_FORM_SCHEMA,
    sections: CHARACTER_DOCUMENT_FORM_SCHEMA.sections.filter((item) =>
      item.id === 'identity' || item.id === section),
  })

  function changed(next: FormValues) {
    onValueChange(characterDocumentFromFormValues(next, enveloped))
  }
</script>

<div class="tint-character-document-editor">
  <nav class="tint-character-editor-sections" aria-label="Character details sections">
    {#each CHARACTER_DOCUMENT_FORM_SCHEMA.sections.filter((item) => item.id !== 'identity') as item (item.id)}
      <button
        type="button"
        aria-pressed={section === item.id}
        disabled={busy}
        onclick={() => section = item.id}
      >{item.title}</button>
    {/each}
  </nav>
  <FormLayout
    schema={visibleSchema}
    {values}
    onValuesChange={changed}
    onSubmit={(envelope) => onSubmit(characterDocumentFromFormValues(envelope.values, enveloped))}
    {busy}
    {error}
    submitLabel="Save character"
    submittingLabel="Saving…"
  />
</div>
