<script lang="ts">
  import { personaPositionOptions, personaRoleOptions, type PersonaEditorProps, type PersonaFields } from '../../core/form/roleplay'
  import NumberField from './NumberField.svelte'
  import SelectField from './SelectField.svelte'
  import TextAreaField from './TextAreaField.svelte'
  import TextField from './TextField.svelte'
  import './roleplay.css'

  let { value, onValueChange, disabled = false }: PersonaEditorProps = $props()
  const id = $props.id()
  function change(patch: Partial<PersonaFields>) { onValueChange({ ...value, ...patch }) }
</script>

<fieldset class="tint-roleplay-editor" {disabled}>
  <legend>Persona details</legend>
  <TextField id={`${id}-name`} label="Persona name" value={value.name} onValueChange={(name) => change({ name })} required {disabled} />
  <TextField id={`${id}-title`} label="Title" value={value.title} onValueChange={(title) => change({ title })} {disabled} />
  <TextAreaField id={`${id}-description`} label="Description" description="Describe the person you play in the chat." value={value.description} onValueChange={(description) => change({ description })} rows={8} {disabled} />
  <SelectField id={`${id}-position`} label="Description placement" value={String(value.position)} onValueChange={(position) => change({ position: Number(position) })} options={personaPositionOptions(value.position)} {disabled} />
  {#if value.position === 4}
    <div class="tint-roleplay-editor__settings">
      <NumberField id={`${id}-depth`} label="Depth" description="0 inserts after the latest chat turn." value={value.depth} onValueChange={(depth) => change({ depth })} min={0} max={1000} step={1} required {disabled} />
      <SelectField id={`${id}-role`} label="Prompt role" value={String(value.role)} onValueChange={(role) => change({ role: Number(role) })} options={personaRoleOptions(value.role)} {disabled} />
    </div>
  {/if}
</fieldset>
