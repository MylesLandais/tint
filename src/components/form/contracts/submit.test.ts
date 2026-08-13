import { describe, expect, it } from 'vitest'
import {
  FormAbortError,
  FormAuthorizationError,
  createFormSubmitEnvelope,
  createMemoryFormTransport,
  type FormSchema,
} from './index'

const schema: FormSchema = {
  id: 'demo',
  version: '1',
  title: 'Demo',
  sections: [],
}

describe('FormTransport promise rules', () => {
  it('settles a successful submit once and replays the same idempotency key', async () => {
    let writes = 0
    const transport = createMemoryFormTransport<{ n: number }, { n: number }>({
      persist: (values) => {
        writes += 1
        return values
      },
    })
    const envelope = createFormSubmitEnvelope(schema, { n: 1 }, { idempotencyKey: 'k1' })
    const first = await transport.submit(envelope)
    const second = await transport.submit(envelope)
    expect(first.value).toEqual({ n: 1 })
    expect(second.requestId).toBe(first.requestId)
    expect(writes).toBe(1)
  })

  it('rejects with FormAbortError when the signal is aborted', async () => {
    const transport = createMemoryFormTransport()
    const envelope = createFormSubmitEnvelope(schema, { n: 1 })
    const controller = new AbortController()
    controller.abort()
    await expect(transport.submit(envelope, { signal: controller.signal })).rejects.toBeInstanceOf(
      FormAbortError,
    )
  })

  it('rejects with FormAuthorizationError rather than resolving a forged write', async () => {
    const transport = createMemoryFormTransport({ authorize: () => false })
    const envelope = createFormSubmitEnvelope(schema, { n: 1 })
    await expect(transport.submit(envelope)).rejects.toBeInstanceOf(FormAuthorizationError)
  })

  it('validate resolves even when the host has nothing extra to check', async () => {
    const transport = createMemoryFormTransport()
    const envelope = createFormSubmitEnvelope(schema, { n: 1 })
    await expect(transport.validate(envelope)).resolves.toEqual({ ok: true, issues: [] })
  })
})
