import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DemoApp } from './DemoApp'

describe('Tint Mock Lab', () => {
  it('shows the ready client contract and fixture contract panels', async () => {
    render(<DemoApp />)
    expect(screen.getByRole('heading', { name: /promises, clients, and host-owned contracts/i })).toBeInTheDocument()
    expect(await screen.findByTestId('client-status')).toHaveTextContent('ready')
    expect(screen.getByRole('heading', { name: 'Feed and policy fixtures' })).toBeInTheDocument()
  })

  it('switches to the degraded capability scenario', async () => {
    render(<DemoApp />)
    screen.getByRole('button', { name: 'Degraded' }).click()
    expect(await screen.findByTestId('client-status')).toHaveTextContent('degraded')
    expect(screen.getByText('storage')).toBeInTheDocument()
  })
})
