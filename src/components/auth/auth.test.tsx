import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OAuthButtons, SignInForm } from './index'

const labels = {
  email: 'Email',
  password: 'Password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
}

describe('SignInForm', () => {
  it('is controlled and submits through the host callback', () => {
    const onEmailChange = vi.fn()
    const onPasswordChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <SignInForm
        email="operator@example.test"
        password="secret"
        labels={labels}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'next@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'next-secret' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!)

    expect(onEmailChange).toHaveBeenCalledWith('next@example.test')
    expect(onPasswordChange).toHaveBeenCalledWith('next-secret')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('exposes busy and error state accessibly', () => {
    render(
      <SignInForm
        email=""
        password=""
        busy
        error="The credentials were not accepted."
        labels={labels}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={() => {}}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('The credentials were not accepted.')
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
  })
})

describe('OAuthButtons', () => {
  it('renders only host-supplied providers with accessible names', () => {
    render(
      <OAuthButtons
        ariaLabel="Connected identity providers"
        providers={[{ id: 'google', label: 'Continue with Google', href: '/oauth/google' }]}
      />,
    )

    expect(screen.getByRole('navigation', { name: 'Connected identity providers' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute('href', '/oauth/google')
    expect(screen.queryByRole('link', { name: /Discord/ })).not.toBeInTheDocument()
  })
})
