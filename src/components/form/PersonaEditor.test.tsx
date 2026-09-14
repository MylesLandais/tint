import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PersonaEditor, type PersonaFields } from './PersonaEditor'

const initial: PersonaFields = Object.freeze({ name: 'Reader', title: 'Navigator', description: 'Original', position: 0, depth: 2, role: 0 })
it('keeps hidden depth choices across placement changes and emits controlled values', () => {
  const changed = vi.fn()
  function Demo() {
    const [value, setValue] = useState(initial)
    return <PersonaEditor value={value} onValueChange={next => { changed(next); setValue(next) }} />
  }
  render(<Demo />)
  expect(screen.queryByLabelText('Depth')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Description placement'), { target: { value: '4' } })
  fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '' } })
  expect(changed.mock.lastCall?.[0].depth).toBe('')
  fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '7' } })
  fireEvent.change(screen.getByLabelText('Prompt role'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Description placement'), { target: { value: '9' } })
  fireEvent.change(screen.getByLabelText('Persona name'), { target: { value: 'Explorer' } })
  expect(changed.mock.lastCall?.[0]).toEqual({ ...initial, name: 'Explorer', position: 9, depth: 7, role: 2 })
  expect(initial.name).toBe('Reader')
})

it('preserves unknown saved choices and uses distinct accessible IDs for multiple editors', () => {
  render(<><PersonaEditor value={{ ...initial, position: 87 }} onValueChange={vi.fn()} disabled />
    <PersonaEditor value={initial} onValueChange={vi.fn()} disabled /></>)
  expect(screen.getByRole('option', { name: 'Saved position 87' })).toBeInTheDocument()
  const names = screen.getAllByLabelText('Persona name')
  expect(names[0].id).not.toBe(names[1].id)
  for (const field of names) expect(field).toBeDisabled()
})
