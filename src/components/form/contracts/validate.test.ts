import { describe, expect, it } from 'vitest'
import {
  defaultValuesForSchema,
  getAtPath,
  isFormFileValue,
  setAtPath,
  validateForm,
  type FormSchema,
} from './index'

const schema: FormSchema = {
  id: 'demo',
  version: '1',
  title: 'Demo',
  sections: [
    {
      id: 'identity',
      title: 'Identity',
      fields: [
        { name: 'email', kind: 'email', label: 'Email', required: true },
        { name: 'data.name', kind: 'text', label: 'Name', required: true },
        { name: 'count', kind: 'number', label: 'Count', min: 1, max: 10 },
        { name: 'tags', kind: 'tags', label: 'Tags' },
      ],
    },
  ],
}

describe('validateForm', () => {
  it('resolves missing required fields as issues, not thrown errors', () => {
    const result = validateForm(schema, { email: '', data: { name: '' }, count: 3, tags: [] })
    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toEqual(['FORM_REQUIRED', 'FORM_REQUIRED'])
    expect(result.issues[0]?.path).toBe('email')
    expect(result.issues[1]?.path).toBe('data.name')
  })

  it('accepts a filled form', () => {
    const result = validateForm(schema, {
      email: 'operator@example.test',
      data: { name: 'Aiko' },
      count: 3,
      tags: ['original'],
    })
    expect(result).toEqual({ ok: true, issues: [] })
  })

  it('flags an out-of-range number', () => {
    const result = validateForm(schema, {
      email: 'operator@example.test',
      data: { name: 'Aiko' },
      count: 99,
      tags: [],
    })
    expect(result.ok).toBe(false)
    expect(result.issues[0]?.code).toBe('FORM_MAX')
  })

  it('flags a malformed email', () => {
    const result = validateForm(schema, {
      email: 'not-an-email',
      data: { name: 'Aiko' },
      count: 1,
      tags: [],
    })
    expect(result.issues[0]?.code).toBe('FORM_EMAIL')
  })

  it('validates repeatable itemSchema fields relative to each row', () => {
    const nested: FormSchema = {
      id: 'lore',
      version: '1',
      title: 'Lore',
      sections: [
        {
          id: 'book',
          title: 'Book',
          fields: [
            {
              name: 'entries',
              kind: 'repeatable',
              label: 'Entries',
              itemSchema: {
                id: 'entry',
                title: '',
                fields: [
                  { name: 'keys', kind: 'tags', label: 'Keys', required: true },
                  { name: 'count', kind: 'number', label: 'Count', min: 1, max: 3 },
                ],
              },
            },
          ],
        },
      ],
    }

    const missing = validateForm(nested, { entries: [{ keys: ['keep'], count: 99 }, { keys: [], count: 2 }] })
    expect(missing.ok).toBe(false)
    expect(missing.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'FORM_MAX', path: 'entries.0.count' }),
        expect.objectContaining({ code: 'FORM_REQUIRED', path: 'entries.1.keys' }),
      ]),
    )

    const filled = validateForm(nested, { entries: [{ keys: ['keep'], count: 2 }] })
    expect(filled).toEqual({ ok: true, issues: [] })
  })
})

describe('values paths', () => {
  it('reads and writes nested and indexed paths without mutating the source', () => {
    const original = { data: { greetings: ['hi'] } }
    const next = setAtPath(original, 'data.greetings.1', 'hello')
    expect(getAtPath(next, 'data.greetings.1')).toBe('hello')
    expect(original.data.greetings).toEqual(['hi'])
  })

  it('rejects a file value that is missing mimeType', () => {
    expect(isFormFileValue({ name: 'a.png', objectUrl: 'blob:1' })).toBe(false)
    expect(isFormFileValue({ name: 'a.png', mimeType: 'image/png', objectUrl: 'blob:1' })).toBe(true)
  })

  it('fills defaults for dotted paths without clobbering siblings', () => {
    const values = defaultValuesForSchema(schema)
    expect(values.email).toBe('')
    expect(values).toMatchObject({ data: { name: '' }, count: 1, tags: [] })
  })
})
