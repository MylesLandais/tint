import { useState, type ReactNode } from 'react'
import { FormLayout } from '../form'
import type { FormSchema, FormValues } from '../form/contracts'
import { CHARACTER_CARD_FORM_SCHEMA } from './schema'
import './library.css'

/** Original V2/V3 document. Unknown fields and flattened envelopes stay intact. */
export type CharacterDocument = Record<string, unknown> & {
  spec: 'chara_card_v2' | 'chara_card_v3'
  spec_version?: string
  data?: Record<string, unknown>
}

export type CharacterDocumentEditorProps = {
  value: CharacterDocument
  onValueChange: (value: CharacterDocument) => void
  onSubmit: (value: CharacterDocument) => void | Promise<void>
  busy?: boolean
  error?: ReactNode
}

const schema: FormSchema = {
  ...CHARACTER_CARD_FORM_SCHEMA,
  id: 'character-document', version: '1', title: 'Character details',
  description: undefined,
  sections: CHARACTER_CARD_FORM_SCHEMA.sections.map(section => ({
    ...section, fields: section.fields.filter(field => field.name !== 'avatar').map(field => field.name === 'data.extensions.depth_prompt.prompt'
      ? { ...field, description: 'Inserted at the chosen message depth.' } : field),
  })),
}

/** Edits paths in the original document; never normalizes it through a V2 model. */
export function CharacterDocumentEditor({ value, onValueChange, onSubmit, busy, error }: CharacterDocumentEditorProps) {
  const [section, setSection] = useState('content')
  const enveloped = value.data != null && typeof value.data === 'object' && !Array.isArray(value.data)
  const fromValues = (next: FormValues) => (enveloped ? next : next.data) as CharacterDocument
  return <div>
    <nav className="tint-character-editor-sections" aria-label="Character details sections">
      {schema.sections.filter(item => item.id !== 'identity').map(item => <button key={item.id} type="button"
        aria-pressed={section === item.id} disabled={busy} onClick={() => setSection(item.id)}>{item.title}</button>)}
    </nav>
    <FormLayout schema={{ ...schema, sections: schema.sections.filter(item => item.id === 'identity' || item.id === section) }} values={enveloped ? value : { data: value }}
    onValuesChange={next => onValueChange(fromValues(next))}
    onSubmit={envelope => onSubmit(fromValues(envelope.values))}
    busy={busy} error={error} submitLabel="Save character" submittingLabel="Saving…" />
  </div>
}
