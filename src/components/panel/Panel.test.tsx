import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Panel } from './Panel'

describe('Panel', () => {
  it('reports disclosure intent and links the trigger to its body', () => {
    const onExpandedChange = vi.fn()
    render(
      <Panel title="Draft" expanded={false} onExpandedChange={onExpandedChange}>
        <p>Preserved body</p>
      </Panel>,
    )

    const trigger = screen.getByRole('button', { name: 'Draft' })
    const body = screen.getByText('Preserved body').parentElement
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls', body?.id)
    expect(body).toHaveAttribute('hidden')

    fireEvent.click(trigger)
    expect(onExpandedChange).toHaveBeenCalledWith(true)
  })

  it('keeps the body mounted while toggling and does not toggle from actions', () => {
    const action = vi.fn()

    function Example() {
      const [expanded, setExpanded] = useState(true)
      return (
        <Panel
          title="Terminal"
          expanded={expanded}
          onExpandedChange={setExpanded}
          actions={<button onClick={action}>Clear</button>}
        >
          <input defaultValue="kept" />
        </Panel>
      )
    }

    render(<Example />)
    const input = screen.getByDisplayValue('kept')

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(action).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Terminal' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Terminal' }))
    expect(input).toBeInTheDocument()
    expect(input.parentElement).toHaveAttribute('hidden')
  })
})
