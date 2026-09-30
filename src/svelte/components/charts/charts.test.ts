import { render, screen, within } from '@testing-library/svelte'
import { tick } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import BarChart from './BarChart.svelte'
import MetricCard from './MetricCard.svelte'
import TimeSeriesChart from './TimeSeriesChart.svelte'

describe('Svelte charts', () => {
  it('renders metric semantics and a controlled empty state', () => {
    render(MetricCard, { label: 'Requests', value: 42, hint: 'last minute' })
    expect(screen.getByText('Requests').closest('[data-tint-metric-card]')).toHaveTextContent('42')
    render(TimeSeriesChart, { data: [], series: [{ key: 'value', label: 'Value' }], xKey: 'time', empty: 'Waiting for samples' })
    expect(screen.getByText('Waiting for samples')).toBeInTheDocument()
  })

  it('draws data with a named graphic and exposes every value in a formatted table', () => {
    render(TimeSeriesChart, {
      data: [{ time: 'morning', value: 3 }, { time: 'evening', value: 5 }],
      series: [{ key: 'value', label: 'Requests' }], xKey: 'time',
      chartLabel: 'Requests over time', tableCaption: 'Request samples',
      xFormatter: (value: string | number | null | undefined) => String(value).toUpperCase(),
      valueFormatter: (value: string | number | null | undefined) => `${value} req`,
    })
    const graphic = screen.getByRole('img', { name: 'Requests over time' })
    expect(graphic.querySelectorAll('circle')).toHaveLength(2)
    const table = screen.getByRole('table', { name: 'Request samples' })
    expect(within(table).getAllByRole('row').slice(1).map((row) => row.textContent)).toEqual(['MORNING3 req', 'EVENING5 req'])
  })

  it('renders stacked bars and can hide the optional data table', async () => {
    const props = {
      data: [{ time: 'now', ok: 3, error: 1 }], xKey: 'time',
      series: [{ key: 'ok', label: 'OK', stackId: 'total' }, { key: 'error', label: 'Errors', stackId: 'total' }],
      showTable: false,
    }
    const { rerender } = render(BarChart, props)
    expect(screen.getByRole('img').querySelectorAll('rect')).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await rerender({ ...props, data: [{ time: 'later', ok: 5, error: 2 }] })
    expect(screen.getByRole('img')).toHaveTextContent('later')
  })

  it('measures its container before setting the SVG viewBox', async () => {
    const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 360 } as DOMRect)
    try {
      render(TimeSeriesChart, { data: [{ time: 'now', value: 3 }], series: [{ key: 'value', label: 'Value' }], xKey: 'time' })
      await tick()
      expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 360 280')
    } finally {
      bounds.mockRestore()
    }
  })
})
