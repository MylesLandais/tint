import { describe, expect, it, vi } from 'vitest'
import { createFormSubmitEnvelope } from '../../form/contracts'
import { FormAbortError } from '../../form/contracts'
import { createGraphNodeFormTransport, graphConfigureCommand } from './formSubmit'

describe('graph form submit', () => {
  it('maps an envelope onto node.configure', () => {
    expect(graphConfigureCommand('n-1', { event: 'webhook' })).toEqual({
      type: 'node.configure',
      nodeId: 'n-1',
      configuration: { event: 'webhook' },
    })
  })

  it('dispatches through the transport and honours abort', async () => {
    const dispatch = vi.fn()
    const transport = createGraphNodeFormTransport(dispatch, 'n-1')
    const envelope = createFormSubmitEnvelope(
      { id: 'graph.trigger', version: '1' },
      { event: 'webhook' },
    )
    const result = await transport.submit(envelope)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'node.configure',
      nodeId: 'n-1',
      configuration: { event: 'webhook' },
    })
    expect(result.value).toEqual({ nodeId: 'n-1' })

    const controller = new AbortController()
    controller.abort()
    await expect(transport.submit(envelope, { signal: controller.signal })).rejects.toBeInstanceOf(
      FormAbortError,
    )
  })
})
