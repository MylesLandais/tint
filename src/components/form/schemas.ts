import type { FormSchema } from './contracts'

/** Email + password. `SignInForm` fills labels from `SignInFormLabels`. */
export function createAuthFormSchema(labels: {
  email: string
  password: string
  showPassword: string
  hidePassword: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
}): FormSchema {
  return {
    id: 'auth.sign-in',
    version: '1',
    title: '',
    sections: [
      {
        id: 'credentials',
        title: '',
        fields: [
          {
            name: 'email',
            kind: 'email',
            label: labels.email,
            required: true,
            placeholder: labels.emailPlaceholder,
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
