import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { RegexRulesEditor, type RegexRuleDocument } from './RegexRulesEditor'

const placements = [{ value: 1, label: 'User' }, { value: 2, label: 'Assistant' }]
it('edits and reorders original documents without losing extension fields', () => {
  const changed = vi.fn()
  const original = Object.freeze({ id: 'saved', scriptName: 'First', findRegex: '/a/g', placement: [1, 88], unknown: { keep: true } })
  function Demo() {
    const [value, setValue] = useState<RegexRuleDocument[]>([original, { scriptName: 'Second' }])
    return <RegexRulesEditor value={value} placements={placements} onValueChange={next => { setValue(next); changed(next) }} />
  }
  render(<Demo />)
  fireEvent.change(within(screen.getByRole('group', { name: 'Rule 1: First' })).getByLabelText('Replacement'), { target: { value: '$1!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Move rule 1 down' }))
  const rule = screen.getByRole('group', { name: 'Rule 2: First' })
  fireEvent.click(within(rule).getByLabelText('Assistant'))
  expect(changed.mock.lastCall?.[0][1]).toEqual({ ...original, replaceString: '$1!', placement: [1, 88, 2] })
  expect(original).not.toHaveProperty('replaceString')
  fireEvent.click(screen.getByRole('button', { name: 'Remove rule 1' }))
  expect(screen.getByRole('group', { name: 'Rule 1: First' })).toBeInTheDocument()
})

it('locks mutation controls while the host saves and supports an empty list', () => {
  const view = render(<RegexRulesEditor value={[]} placements={placements} onValueChange={vi.fn()} disabled />)
  expect(screen.getByText('No regex rules.')).toBeInTheDocument()
  expect(screen.getByRole('button')).toBeDisabled()
  view.rerender(<RegexRulesEditor value={[{ scriptName: 'Saved' }]} placements={placements} onValueChange={vi.fn()} disabled />)
  expect(screen.getByRole('textbox', { name: 'Find expression' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Remove rule 1' })).toBeDisabled()
})
