import type { FormSchema } from '../form/contracts'
import { emptyLoreEntry } from './parse'

export const CHARACTER_CARD_FORM_SCHEMA: FormSchema = {
  id: 'character-card.v2',
  version: '2.0',
  title: 'Character card',
  description: 'SillyTavern-shaped Character Card V2. Unknown extension keys survive import and export.',
  sections: [
    {
      id: 'identity',
      title: 'Identity',
      fields: [
        { name: 'avatar', kind: 'file', label: 'Avatar', accept: 'image/png,image/jpeg,image/webp' },
        { name: 'data.name', kind: 'text', label: 'Name', required: true, placeholder: 'Character name' },
        { name: 'data.tags', kind: 'tags', label: 'Tags', placeholder: 'Add a tag and press Enter' },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'The fields that shape a new chat: who they are, how they open, and alternate greetings.',
      fields: [
        { name: 'data.description', kind: 'textarea', label: 'Description' },
        { name: 'data.first_mes', kind: 'textarea', label: 'First message' },
        {
          name: 'data.alternate_greetings',
          kind: 'repeatable',
          label: 'Alternate greetings',
          itemKind: 'textarea',
          defaultItem: '',
          addLabel: 'Add greeting',
        },
      ],
    },
    {
      id: 'personality',
      title: 'Personality',
      fields: [
        { name: 'data.personality', kind: 'textarea', label: 'Personality summary' },
        { name: 'data.scenario', kind: 'textarea', label: 'Scenario' },
        { name: 'data.mes_example', kind: 'textarea', label: 'Example messages' },
        {
          name: 'data.extensions.depth_prompt.prompt',
          kind: 'textarea',
          label: "Character's note",
          description: 'Inserted at the chosen depth. Stored in extensions.depth_prompt.',
        },
        {
          name: 'data.extensions.depth_prompt.depth',
          kind: 'number',
          label: 'Note depth',
          min: 0,
          max: 32,
          step: 1,
        },
        {
          name: 'data.extensions.depth_prompt.role',
          kind: 'select',
          label: 'Note role',
          options: [
            { value: 'system', label: 'System' },
            { value: 'user', label: 'User' },
            { value: 'assistant', label: 'Assistant' },
          ],
        },
        {
          name: 'data.extensions.talkativeness',
          kind: 'slider',
          label: 'Talkativeness',
          min: 0,
          max: 1,
          step: 0.05,
        },
      ],
    },
    {
      id: 'prompts',
      title: 'Prompt overrides',
      fields: [
        { name: 'data.system_prompt', kind: 'textarea', label: 'Main prompt' },
        { name: 'data.post_history_instructions', kind: 'textarea', label: 'Post-history instructions' },
      ],
    },
    {
      id: 'creator',
      title: 'Creator metadata',
      fields: [
        { name: 'data.creator', kind: 'text', label: 'Creator' },
        { name: 'data.character_version', kind: 'text', label: 'Character version' },
        { name: 'data.creator_notes', kind: 'textarea', label: "Creator's notes" },
      ],
    },
    {
      id: 'lore',
      title: 'Character lore',
      description: 'Embedded world info. Entries fire on keys and insert into context.',
      fields: [
        { name: 'data.character_book.name', kind: 'text', label: 'Book name' },
        { name: 'data.character_book.description', kind: 'textarea', label: 'Book description' },
        { name: 'data.character_book.scan_depth', kind: 'number', label: 'Scan depth', min: 0, max: 200, step: 1 },
        { name: 'data.character_book.token_budget', kind: 'number', label: 'Token budget', min: 0, max: 20000, step: 1 },
        { name: 'data.character_book.recursive_scanning', kind: 'toggle', label: 'Recursive scanning' },
        {
          name: 'data.character_book.entries',
          kind: 'repeatable',
          label: 'Lore entries',
          addLabel: 'Add entry',
          defaultItem: emptyLoreEntry(),
          itemSchema: {
            id: 'lore-entry',
            title: '',
            fields: [
              { name: 'keys', kind: 'tags', label: 'Keys', placeholder: 'Trigger keywords' },
              { name: 'secondary_keys', kind: 'tags', label: 'Secondary keys' },
              { name: 'content', kind: 'textarea', label: 'Content' },
              { name: 'enabled', kind: 'toggle', label: 'Enabled' },
              { name: 'selective', kind: 'toggle', label: 'Selective' },
              { name: 'constant', kind: 'toggle', label: 'Constant' },
              { name: 'insertion_order', kind: 'number', label: 'Insertion order', min: 0, max: 10000, step: 1 },
              {
                name: 'position',
                kind: 'select',
                label: 'Position',
                options: [
                  { value: 'before_char', label: 'Before character' },
                  { value: 'after_char', label: 'After character' },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
}
