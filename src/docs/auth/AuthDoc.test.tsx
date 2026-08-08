import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthDoc } from './AuthDoc'

/**
 * The Auth page is the only doc page driving a real state machine, so it gets a
 * smoke test: the demo transport, the client, and the form have to agree.
 */
function submitSignIn() {
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!)
}

describe('AuthDoc', () => {
  it('signs in with the demo credential and back out again', async () => {
    render(<AuthDoc />)

    await screen.findByRole('button', { name: 'Sign in' })
    submitSignIn()

    expect(await screen.findByText('operator@example.test')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument())
  })

  it('surfaces a rejected credential', async () => {
    render(<AuthDoc />)

    const password = await screen.findByLabelText('Password')
    fireEvent.change(password, { target: { value: 'wrong' } })
    submitSignIn()

    expect(await screen.findByRole('alert')).toHaveTextContent('credentials were not accepted')
  })

  it('reports flows the transport does not implement', async () => {
    render(<AuthDoc />)

    fireEvent.click(await screen.findByRole('button', { name: 'Try to sign up' }))

    expect(await screen.findByText(/does not support password sign-up/i)).toBeInTheDocument()
  })
})
