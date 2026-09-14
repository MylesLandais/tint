import React, { useId } from 'react'
import { FormControl } from './FormControl'
import { NumberField, SelectField, TextAreaField, TextField } from './inputs'

void React

export type PersonaFields = {
  name: string
  title: string
  description: string
  position: number
  depth: number | string
  role: number
}

export type PersonaEditorProps = {
  value: PersonaFields
  onValueChange: (value: PersonaFields) => void
  disabled?: boolean
}

/** Controlled identity and prompt fields. The host owns the catalog and saves. */
export function PersonaEditor({ value, onValueChange, disabled = false }: PersonaEditorProps) {
  const id = useId()
  const change = (patch: Partial<PersonaFields>) => onValueChange({ ...value, ...patch })
  return <fieldset className="tint-persona-editor" disabled={disabled}>
    <legend>Persona details</legend>
    <FormControl id={`${id}-name`} label="Persona name">
      <TextField id={`${id}-name`} value={value.name} onChange={name => change({ name })} required disabled={disabled} />
    </FormControl>
    <FormControl id={`${id}-title`} label="Title">
      <TextField id={`${id}-title`} value={value.title} onChange={title => change({ title })} disabled={disabled} />
    </FormControl>
    <FormControl id={`${id}-description`} label="Description" description="Describe the person you play in the chat.">
      <TextAreaField id={`${id}-description`} value={value.description} onChange={description => change({ description })} rows={8} disabled={disabled} description="Describe the person you play in the chat." />
    </FormControl>
    <FormControl id={`${id}-position`} label="Description placement">
      <SelectField id={`${id}-position`} value={String(value.position)} onChange={position => change({ position: Number(position) })} disabled={disabled}
        options={[
          { value: '0', label: 'System prompt' }, { value: '2', label: 'Before the author note' },
          { value: '3', label: 'After the author note' }, { value: '4', label: 'At chat depth' }, { value: '9', label: 'Do not insert' },
          ...([0, 2, 3, 4, 9].includes(value.position) ? [] : [{ value: String(value.position), label: `Saved position ${value.position}` }]),
        ]} />
    </FormControl>
    {value.position === 4 && <div className="tint-persona-editor__depth">
      <FormControl id={`${id}-depth`} label="Depth" description="0 inserts after the latest chat turn.">
        <NumberField id={`${id}-depth`} value={value.depth} onChange={depth => change({ depth })} min={0} max={1000} step={1} required disabled={disabled} description="0 inserts after the latest chat turn." />
      </FormControl>
      <FormControl id={`${id}-role`} label="Prompt role">
        <SelectField id={`${id}-role`} value={String(value.role)} onChange={role => change({ role: Number(role) })} disabled={disabled}
          options={[{ value: '0', label: 'System' }, { value: '1', label: 'User' }, { value: '2', label: 'Assistant' },
            ...([0, 1, 2].includes(value.role) ? [] : [{ value: String(value.role), label: `Saved role ${value.role}` }])]} />
      </FormControl>
    </div>}
  </fieldset>
}
