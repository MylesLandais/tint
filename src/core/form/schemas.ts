import type { FormSchema } from './contracts'

/** Identifier + password. Auth forms choose whether the identifier is a username or email. */
export function createCredentialFormSchema(labels: {
  identifier: string
  password: string
  showPassword: string
  hidePassword: string
  identifierPlaceholder?: string
  passwordPlaceholder?: string
}): FormSchema {
  return {
    id: 'auth.credentials',
    version: '2',
    title: '',
    sections: [
      {
        id: 'credentials',
        title: '',
        fields: [
          {
            name: 'identifier',
            kind: 'text',
            label: labels.identifier,
            required: true,
            placeholder: labels.identifierPlaceholder,
          },
          {
            name: 'password',
            kind: 'password',
            label: labels.password,
            required: true,
            placeholder: labels.passwordPlaceholder,
            showPasswordLabel: labels.showPassword,
            hidePasswordLabel: labels.hidePassword,
          },
        ],
      },
    ],
  }
}

/** Docs preview covering every field kind without pulling in a character card. */
export const DEMO_FORM_SCHEMA: FormSchema = {
  id: 'tint.form.demo',
  version: '1',
  title: 'Demo form',
  description: 'A schema-driven layout. Edit the JSON on the docs page and this re-renders.',
  sections: [
    {
      id: 'identity',
      title: 'Identity',
      fields: [
        { name: 'name', kind: 'text', label: 'Name', required: true, placeholder: 'Aiko' },
        { name: 'email', kind: 'email', label: 'Email', required: true },
        { name: 'role', kind: 'select', label: 'Role', options: [
          { value: 'system', label: 'System' },
          { value: 'user', label: 'User' },
          { value: 'assistant', label: 'Assistant' },
        ] },
      ],
    },
    {
      id: 'notes',
      title: 'Notes',
      fields: [
        { name: 'bio', kind: 'textarea', label: 'Biography', placeholder: 'A short summary.' },
        { name: 'tags', kind: 'tags', label: 'Tags', placeholder: 'Add a tag and press Enter' },
        { name: 'talkativeness', kind: 'slider', label: 'Talkativeness', min: 0, max: 1, step: 0.05 },
        { name: 'enabled', kind: 'toggle', label: 'Enabled' },
        { name: 'depth', kind: 'number', label: 'Note depth', min: 0, max: 32, step: 1 },
        {
          name: 'greetings',
          kind: 'repeatable',
          label: 'Greetings',
          itemKind: 'textarea',
          defaultItem: '',
          addLabel: 'Add greeting',
        },
      ],
    },
  ],
}
