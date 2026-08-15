import { describe, expect, it } from 'vitest'
import {
  defaultValuesForSchema,
  getAtPath,
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
})

describe('values paths', () => {
  it('reads and writes nested and indexed paths without mutating the source', () => {
    const original = { data: { greetings: ['hi'] } }
    const next = setAtPath(original, 'data.greetings.1', 'hello')
    expect(getAtPath(next, 'data.greetings.1')).toBe('hello')
    expect(original.data.greetings).toEqual(['hi'])
  })

  it('fills defaults for dotted paths without clobbering siblings', () => {
    const values = defaultValuesForSchema(schema)
    expect(values.email).toBe('')
    expect(values).toMatchObject({ data: { name: '' }, count: 1, tags: [] })
  })
})
