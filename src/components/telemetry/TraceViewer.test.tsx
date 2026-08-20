import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TraceViewer } from './TraceViewer'
import { TraceWaterfall } from './TraceWaterfall'
import type { TelemetryTrace } from './types'

const trace: TelemetryTrace = {
  traceId: 'trc-view',
  name: 'Group conversation',
  spans: [
    {
      traceId: 'trc-view',
      spanId: 'conv',
      name: 'conversation',
      service: 'tint.chat',
      kind: 'server',
      status: 'ok',
      startMs: 0,
      endMs: 80,
    },
    {
      traceId: 'trc-view',
      spanId: 'maya-llm',
      parentSpanId: 'conv',
      name: 'llm.generate',
      service: 'mock.llm',
      kind: 'client',
      status: 'ok',
      startMs: 10,
      endMs: 40,
      attributes: { 'gen_ai.request.model': 'mock-qwen-chat' },
      input: { prompt: 'hello' },
      output: { text: 'Maya here' },
    },
  ],
}

describe('TraceWaterfall', () => {
  it('renders a Gantt row per span and reports selection', () => {
    const onSelectedSpanIdChange = vi.fn()
    render(
      <TraceWaterfall
        trace={trace}
        selectedSpanId={null}
        onSelectedSpanIdChange={onSelectedSpanIdChange}
      />,
    )

    fireEvent.click(screen.getByRole('option', { name: /llm\.generate/ }))
    expect(onSelectedSpanIdChange).toHaveBeenCalledWith('maya-llm')
  })
})

describe('TraceViewer', () => {
  it('shows RED metrics and inspects the selected span', () => {
    render(<TraceViewer trace={trace} />)

    expect(screen.getByText('Spans')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('option', { name: /llm\.generate/ }))
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText(/Maya here/)).toBeInTheDocument()
    expect(screen.getByText('gen_ai.request.model')).toBeInTheDocument()
  })
})
