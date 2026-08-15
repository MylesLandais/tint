import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordField } from './fields'

/**
 * `hasStoredValue` exists for write-only secret stores.
 *
 * The backend holds a value it will never return, so an empty field means both
 * "no secret" and "a secret you cannot see". Without the distinction an operator
 * cannot tell whether saving will clear the stored credential.
 */
describe('PasswordField hasStoredValue', () => {
  it('says a value is stored, and describes the input with it', () => {
    render(<PasswordField id="secret" value="" onChange={() => {}} hasStoredValue />)

    const hint = screen.getByText('A value is stored. Leave blank to keep it.')
    expect(hint).toBeInTheDocument()
    expect(screen.getByLabelText<HTMLInputElement>('Show password')).toBeInTheDocument()

    const input = document.getElementById('secret')
    expect(input?.getAttribute('aria-describedby')).toContain('secret-stored')
    expect(hint).toHaveAttribute('id', 'secret-stored')
  })

  it('drops required while a value is stored, so an empty submit keeps it', () => {
    const { rerender } = render(
      <PasswordField id="secret" value="" onChange={() => {}} required hasStoredValue />,
    )
    expect(document.getElementById('secret')).not.toBeRequired()

    rerender(<PasswordField id="secret" value="" onChange={() => {}} required />)
    expect(document.getElementById('secret')).toBeRequired()
  })

  it('says nothing when no value is stored', () => {
    render(<PasswordField id="secret" value="" onChange={() => {}} />)
    expect(screen.queryByText(/value is stored/)).not.toBeInTheDocument()
    expect(document.getElementById('secret')?.getAttribute('aria-describedby')).toBeNull()
  })

  it('takes a caller-supplied wording', () => {
    render(
      <PasswordField
        id="secret"
        value=""
        onChange={() => {}}
        hasStoredValue
        storedValueLabel="An API key is already saved."
      />,
    )
    expect(screen.getByText('An API key is already saved.')).toBeInTheDocument()
  })
})
