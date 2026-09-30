import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import IdentifierSignInForm from './IdentifierSignInForm.svelte'
import CredentialRecoveryForm from './CredentialRecoveryForm.svelte'
import PasswordCredentialInput from './PasswordCredentialInput.svelte'
import OAuthButtons from './OAuthButtons.svelte'

const labels = {
  identifier: 'Email', password: 'Password', submit: 'Sign in', submitting: 'Signing in…',
  showPassword: 'Show password', hidePassword: 'Hide password',
}

describe('Svelte auth forms', () => {
  it('reports credential edits and submits host-owned values', async () => {
    const onIdentifierChange = vi.fn()
    const onSubmit = vi.fn()
    render(IdentifierSignInForm, {
      identifier: 'ada@example.test', password: 'secret', labels,
      onIdentifierChange, onPasswordChange: vi.fn(), onSubmit,
    })
    await fireEvent.input(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'new@example.test' } })
    expect(onIdentifierChange).toHaveBeenCalledWith('new@example.test')
    await fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
  })

  it('keeps recovery submission controlled and respects busy state', async () => {
    const onSubmit = vi.fn()
    const view = render(CredentialRecoveryForm, {
      identifier: 'ada@example.test', label: 'Account email', busy: true,
      onIdentifierChange: vi.fn(), onSubmit,
    })
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
    await fireEvent.submit(screen.getByRole('button', { name: 'Submitting…' }).closest('form')!)
    expect(onSubmit).not.toHaveBeenCalled()
    await view.rerender({ identifier: 'ada@example.test', label: 'Account email', busy: false, onIdentifierChange: vi.fn(), onSubmit })
    await fireEvent.submit(screen.getByRole('button', { name: 'Continue' }).closest('form')!)
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('connects recovery help to the identifier field', () => {
    render(CredentialRecoveryForm, {
      identifier: '', label: 'Account email', help: 'Use your registered address.',
      onIdentifierChange: vi.fn(), onSubmit: vi.fn(),
    })
    const field = screen.getByRole('textbox', { name: 'Account email' })
    const help = screen.getByText('Use your registered address.')
    expect(field).toHaveAttribute('aria-describedby', help.id)
  })

  it('provides an accessible password visibility control', async () => {
    render(PasswordCredentialInput, { label: 'New password', value: 'secret', onValueChange: vi.fn() })
    const field = screen.getByLabelText('New password')
    expect(field).toHaveAttribute('type', 'password')
    await fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(field).toHaveAttribute('type', 'text')
  })

  it('renders provider actions as labelled links', () => {
    render(OAuthButtons, { providers: [{ id: 'example', label: 'Continue with Example', href: '/auth/example' }], ariaLabel: 'Other sign-in methods' })
    expect(screen.getByRole('navigation', { name: 'Other sign-in methods' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue with Example' })).toHaveAttribute('href', '/auth/example')
  })
})
