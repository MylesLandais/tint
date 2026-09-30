import { describe, expect, it } from 'vitest'
import {
  firstFormErrorsByPath,
  formFieldId,
  formNumber,
  formSliderValue,
  joinFormPath,
} from './render'

describe('form render model', () => {
  it('keeps repeatable item paths stable and gives fields safe IDs', () => {
    expect(joinFormPath('data.entries.0', 'keys')).toBe('data.entries.0.keys')
    expect(joinFormPath('data.entries.0', '')).toBe('data.entries.0')
    expect(formFieldId('form-1', 'data.entries.0.keys', 'Keys')).toBe('form-1-data-entries-0-keys')
  })

  it('takes the first error per path, ignoring warnings and pathless issues', () => {
    const errors = firstFormErrorsByPath([
      { path: 'name', severity: 'warning', message: 'warning' },
      { path: 'name', severity: 'error', message: 'first' },
      { path: 'name', severity: 'error', message: 'second' },
      { severity: 'error', message: 'form error' },
    ])
    expect([...errors]).toEqual([['name', 'first']])
  })

  it('preserves blank numeric fields and falls back for a slider', () => {
    expect(formNumber('')).toBe('')
    expect(formNumber('2')).toBe(2)
    expect(formSliderValue('', 4)).toBe(4)
  })
})
