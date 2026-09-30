import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import ScatterPlot from './ScatterPlot.svelte'

describe('Svelte ScatterPlot', () => {
  it('offers keyboard selection at a point and an equivalent table button', async () => {
    const onSelect = vi.fn()
    render(ScatterPlot, {
      rows: [{ id: 'a', label: 'Alpha', x: 1, y: 2 }],
      label: 'Scores', xLabel: 'Size', yLabel: 'Score', selectedId: 'a', onSelect,
    })
    const point = screen.getByRole('button', { name: 'Alpha: 1, 2' })
    expect(screen.getByRole('group', { name: 'Scores' })).toContainElement(point)
    expect(point).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.keyDown(point, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('a')
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
  })
})
