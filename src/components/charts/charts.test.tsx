import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricCard, TimeSeriesChart } from './index'

describe('charts', () => {
  it('renders metric semantics without a chart provider', () => {
    render(<MetricCard label="Requests" value="42" hint="last minute" />)
    expect(screen.getByText('Requests').closest('[data-tint-metric-card]')).toHaveTextContent('42')
  })

  it('renders a controlled empty state without booting the engine', () => {
    render(<TimeSeriesChart data={[]} series={[{ key: 'value', label: 'Value' }]} xKey="time" empty="Waiting for samples" />)
    expect(screen.getByText('Waiting for samples')).toBeInTheDocument()
  })

  it('includes an accessible table for non-empty data', () => {
    render(<TimeSeriesChart data={[{ time: 'now', value: 3 }]} series={[{ key: 'value', label: 'Value' }]} xKey="time" tableCaption="Samples" />)
    expect(screen.getByRole('table', { name: 'Samples' })).toHaveTextContent('3')
  })
})
