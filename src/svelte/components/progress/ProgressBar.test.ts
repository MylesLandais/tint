import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import ProgressBar from './ProgressBar.svelte'

describe('ProgressBar', () => {
  it('clamps a reading and labels the determinate track', () => {
    render(ProgressBar, { value: 138, label: 'Transfer', showValue: true })
    expect(screen.getByRole('progressbar', { name: 'Transfer' })).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('does not expose a non-finite ARIA value', () => {
    render(ProgressBar, { value: Number.NaN, label: 'Transfer' })
    expect(screen.getByRole('progressbar', { name: 'Transfer' })).toHaveAttribute('aria-valuenow', '0')
  })
})
