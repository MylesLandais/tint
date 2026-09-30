import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { TelemetryTrace } from '../../../core/telemetry/types'
import TraceServiceMap from './TraceServiceMap.svelte'
import TraceViewer from './TraceViewer.svelte'
import TraceWaterfall from './TraceWaterfall.svelte'

const trace: TelemetryTrace = {
  traceId: 'trc-view',
  name: 'Group conversation',
  spans: [
    { traceId: 'trc-view', spanId: 'conv', name: 'conversation', service: 'tint.chat',
      kind: 'server', status: 'ok', startMs: 0, endMs: 80 },
    { traceId: 'trc-view', spanId: 'llm', parentSpanId: 'conv', name: 'llm.generate',
      service: 'mock.llm', kind: 'client', status: 'error', startMs: 10, endMs: 40,
      attributes: { 'gen_ai.request.model': 'mock-qwen-chat' },
      input: { prompt: 'hello' }, output: { text: 'Maya here' } },
  ],
}

describe('Svelte telemetry', () => {
  it('exposes one selectable waterfall option per span and reports selected IDs', async () => {
    const onSelectedSpanIdChange = vi.fn()
    render(TraceWaterfall, { trace, selectedSpanId: null, onSelectedSpanIdChange })
    expect(screen.getAllByRole('option')).toHaveLength(2)
    await fireEvent.click(screen.getByRole('option', { name: /llm\.generate/ }))
    expect(onSelectedSpanIdChange).toHaveBeenCalledWith('llm')
  })

  it('moves the active waterfall option with arrow keys and reports selection intent', async () => {
    const onSelectedSpanIdChange = vi.fn()
    render(TraceWaterfall, { trace, selectedSpanId: 'conv', onSelectedSpanIdChange })
    const first = screen.getByRole('option', { name: /conversation/ })
    const second = screen.getByRole('option', { name: /llm\.generate/ })
    expect(first).toHaveAttribute('tabindex', '0')
    await fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(onSelectedSpanIdChange).toHaveBeenCalledWith('llm')
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('aria-selected', 'false')
  })

  it('shows RED metrics and inspects the selected span in uncontrolled mode', async () => {
    render(TraceViewer, { trace })
    expect(screen.getByText('Spans')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /conversation/ })).toHaveAttribute('aria-selected', 'true')
    await fireEvent.click(screen.getByRole('option', { name: /llm\.generate/ }))
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText(/Maya here/)).toBeInTheDocument()
    expect(screen.getByText('gen_ai.request.model')).toBeInTheDocument()
  })

  it('leaves a controlled viewer unchanged until the host updates its ID', async () => {
    const onSelectedSpanIdChange = vi.fn()
    const view = render(TraceViewer, { trace, selectedSpanId: null, onSelectedSpanIdChange })
    await fireEvent.click(screen.getByRole('option', { name: /llm\.generate/ }))
    expect(onSelectedSpanIdChange).toHaveBeenCalledWith('llm')
    expect(screen.getByText(/Select a span in the waterfall/)).toBeInTheDocument()
    await view.rerender({ trace, selectedSpanId: 'llm', onSelectedSpanIdChange })
    expect(screen.getByText(/Maya here/)).toBeInTheDocument()
  })

  it('renders accessible service nodes, calls, selection, and a summary', async () => {
    const onSelectedServiceChange = vi.fn()
    render(TraceServiceMap, { trace, onSelectedServiceChange })
    const llm = screen.getByRole('button', { name: /mock\.llm: 1 span, failed spans/ })
    await fireEvent.click(llm)
    expect(onSelectedServiceChange).toHaveBeenCalledWith('mock.llm')
    expect(llm).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Failed spans present/)).toBeInTheDocument()
    await fireEvent.click(screen.getByText(/Service calls \(1\)/))
    expect(screen.getByText(/tint\.chat → mock\.llm/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onSelectedServiceChange).toHaveBeenLastCalledWith(null)
  })

  it('keeps service selection controlled by the host', async () => {
    const onSelectedServiceChange = vi.fn()
    const view = render(TraceServiceMap, {
      trace, selectedService: 'tint.chat', onSelectedServiceChange,
    })
    const chat = screen.getByRole('button', { name: /tint\.chat: 1 span/ })
    const llm = screen.getByRole('button', { name: /mock\.llm: 1 span/ })
    expect(chat).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(llm)
    expect(onSelectedServiceChange).toHaveBeenCalledWith('mock.llm')
    expect(llm).toHaveAttribute('aria-pressed', 'false')
    await view.rerender({ trace, selectedService: 'mock.llm', onSelectedServiceChange })
    expect(llm).toHaveAttribute('aria-pressed', 'true')
  })
})
