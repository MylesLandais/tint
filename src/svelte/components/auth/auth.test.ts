import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import IdentifierSignInForm from './IdentifierSignInForm.svelte'
import CredentialRecoveryForm from './CredentialRecoveryForm.svelte'
import PasswordCredentialInput from './PasswordCredentialInput.svelte'
import OAuthButtons from './OAuthButtons.svelte'
import LoginForm from './LoginForm.svelte'
import RegistrationForm from './RegistrationForm.svelte'
import AuthDivider from './AuthDivider.svelte'
import type { LoginFormLabels, RegistrationFormLabels } from './types'

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

  it('draws brand marks for known providers and marks the last-used one', () => {
    const { container } = render(OAuthButtons, {
      providers: [
        { id: 'github', label: 'Continue with GitHub', href: '/auth/github' },
        { id: 'discord', label: 'Continue with Discord', href: '/auth/discord' },
        { id: 'example', label: 'Continue with Example', href: '/auth/example' },
      ],
      ariaLabel: 'Other sign-in methods', layout: 'row', lastUsed: 'github',
    })
    expect(container.querySelector('nav')).toHaveAttribute('data-layout', 'row')
    expect(container.querySelectorAll('[data-provider-mark]')).toHaveLength(2)
    const github = screen.getByRole('link', { name: /Continue with GitHub/ })
    expect(github).toHaveAccessibleName('Continue with GitHub Last used')
    expect(github).toHaveAttribute('data-last-used')
    expect(screen.getByRole('link', { name: 'Continue with Discord' })).not.toHaveAttribute('data-last-used')
  })

  it('lets hosts intercept a provider choice', async () => {
    const onSelect = vi.fn((_provider, event: MouseEvent) => event.preventDefault())
    render(OAuthButtons, { providers: [{ id: 'google', label: 'Google', href: '/auth/google' }], ariaLabel: 'Providers', onSelect })
    await fireEvent.click(screen.getByRole('link', { name: 'Google' }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'google' }), expect.any(MouseEvent))
  })

  it('names the divider for assistive technology', () => {
    render(AuthDivider, { label: 'or' })
    expect(screen.getByRole('separator', { name: 'or' })).toBeInTheDocument()
  })
})

const loginLabels: LoginFormLabels = {
  identifier: 'Email', password: 'Password', submit: 'Sign in', continue: 'Continue', submitting: 'Signing in…',
  showPassword: 'Show password', hidePassword: 'Hide password',
  identifierRequired: 'Enter your email.', passwordRequired: 'Enter your password.',
  changeIdentifier: 'Use a different email', forgotPassword: 'Forgot password?',
  providers: 'Other sign-in methods', divider: 'or', lastUsed: 'Last used',
}

describe('LoginForm', () => {
  it('walks the email-first flow before submitting', async () => {
    const onSubmit = vi.fn()
    const props = {
      identifier: '', password: '', labels: loginLabels, mode: 'email-first' as const,
      onIdentifierChange: vi.fn(), onPasswordChange: vi.fn(), onSubmit,
    }
    const view = render(LoginForm, props)
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()

    await view.rerender({ ...props, identifier: 'ada@example.test' })
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument()
    expect(screen.getByText('ada@example.test')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await view.rerender({ ...props, identifier: 'ada@example.test', password: 'secret' })
    await fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(onSubmit).toHaveBeenCalledOnce()

    await fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(screen.getByRole('textbox', { name: /^Email/ })).toBeInTheDocument()
  })

  it('shows providers with the last-used badge above the divider', () => {
    render(LoginForm, {
      identifier: '', password: '', labels: loginLabels, lastUsed: 'google',
      providers: [{ id: 'google', label: 'Continue with Google', href: '/auth/google' }],
      onIdentifierChange: vi.fn(), onPasswordChange: vi.fn(), onSubmit: vi.fn(),
    })
    expect(screen.getByRole('navigation', { name: 'Other sign-in methods' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue with Google Last used' })).toBeInTheDocument()
    expect(screen.getByRole('separator', { name: 'or' })).toBeInTheDocument()
  })
})

const registrationLabels: RegistrationFormLabels = {
  displayName: 'Name', email: 'Email', password: 'Password', inviteCode: 'Invite code',
  submit: 'Create account', submitting: 'Creating account…', showPassword: 'Show password', hidePassword: 'Hide password',
  providers: 'Sign up with', divider: 'or', lastUsed: 'Last used',
  errors: { required: 'Required.', invalid_email: 'Enter a valid email.', password_too_short: 'Use at least {min} characters.' },
}

describe('RegistrationForm', () => {
  it('validates on submit and only then calls the host', async () => {
    const onSubmit = vi.fn()
    const props = {
      values: { email: 'ada@', password: 'short' }, labels: registrationLabels,
      policy: { inviteRequired: true, minPasswordLength: 10 }, onValuesChange: vi.fn(), onSubmit,
    }
    const view = render(RegistrationForm, props)
    expect(screen.getByRole('textbox', { name: /^Invite code/ })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 10 characters.')).toBeInTheDocument()
    expect(screen.getByText('Required.')).toBeInTheDocument()

    const values = { email: 'ada@example.test', password: 'long enough!', inviteCode: 'TINT' }
    await view.rerender({ ...props, values })
    await fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(onSubmit).toHaveBeenCalledWith(values)
  })

  it('reports edits as whole values', async () => {
    const onValuesChange = vi.fn()
    render(RegistrationForm, {
      values: { email: '', password: '', displayName: '' }, labels: registrationLabels,
      onValuesChange, onSubmit: vi.fn(),
    })
    expect(screen.queryByRole('textbox', { name: /^Invite code/ })).not.toBeInTheDocument()
    await fireEvent.input(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada' } })
    expect(onValuesChange).toHaveBeenCalledWith({ email: '', password: '', displayName: 'Ada' })
  })
})
