/**
 * A form as data: sections of named fields, independent of React.
 *
 * Hosts treat this the way Foundry treats a function's input type — the schema
 * *is* the contract. `FormLayout` renders it; `FormTransport.submit` receives
 * the same shape the schema described. Nothing here knows about graph nodes or
 * character cards; those supply a schema, they do not invent a second one.
 */

export type FormFieldKind =
  | 'text'
  | 'textarea'
  | 'password'
  | 'email'
  | 'number'
  | 'select'
  | 'slider'
  | 'toggle'
  | 'tags'
  | 'file'
  | 'repeatable'

export type FormSelectOption = {
  value: string
  label: string
}

export type FormField = {
  /** Dotted path into the values object (`data.name`, `entries.0.keys`). */
  name: string
  kind: FormFieldKind
  label: string
  description?: string
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: readonly FormSelectOption[]
  /** Primitive repeatable (alternate greetings are `string[]`). */
  itemKind?: FormFieldKind
  /** Object repeatable (lore entries). Field names are relative to each item. */
  itemSchema?: FormSection
  /** Value pushed when the user adds a repeatable row. */
  defaultItem?: unknown
  accept?: string
  showPasswordLabel?: string
  hidePasswordLabel?: string
  addLabel?: string
  removeLabel?: string
}

export type FormSection = {
  id: string
  title: string
  description?: string
  fields: readonly FormField[]
}

export type FormSchema = {
  id: string
  version: string
  title: string
  description?: string
  sections: readonly FormSection[]
}

export const FORM_FIELD_KINDS: readonly FormFieldKind[] = [
  'text',
  'textarea',
  'password',
  'email',
  'number',
  'select',
  'slider',
  'toggle',
  'tags',
  'file',
  'repeatable',
]

export function listFormFieldKinds(): readonly FormFieldKind[] {
  return FORM_FIELD_KINDS
}

/** Flatten every field, including those nested in repeatable item schemas. */
export function flattenFormFields(schema: FormSchema): readonly FormField[] {
  const fields: FormField[] = []
  const walk = (sections: readonly FormSection[]) => {
    for (const section of sections) {
      for (const field of section.fields) {
        fields.push(field)
        if (field.itemSchema) walk([field.itemSchema])
      }
    }
  }
  walk(schema.sections)
  return fields
}
