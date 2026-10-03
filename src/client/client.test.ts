import { describe, expect, it, vi } from 'vitest'
import { createAuthClient, defineAuthOperation, type AuthConfig, type AuthTransport } from '../auth/client'
import { createFetchRequestAdapter, createMemoryOperationAdapter, createTintClient, TintCapabilityError } from './public'
import type { TintCapability } from './types'

const request = { async send<T>() { return { status: 200, headers: {}, data: undefined as T } } }

function capability(start = vi.fn(), stop = vi.fn()): TintCapability {
  return { start, stop }
}

describe('TintClient', () => {
  it('reference-counts lifecycle and defers the final stop for StrictMode remounts', async () => {
    const start = vi.fn()
    const stop = vi.fn()
    const client = createTintClient({ request, storage: capability(start, stop) as never })

    await client.start()
    await client.start()
    client.stop()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(stop).not.toHaveBeenCalled()
    client.stop()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(start).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
    expect(client.getSnapshot().status).toBe('stopped')
  })

  it('reports optional capability failures explicitly', () => {
    const client = createTintClient({ request })
    expect(() => client.require('uploads')).toThrow(TintCapabilityError)
  })

  it('has a deterministic server snapshot', () => {
    const client = createTintClient({ request })
    expect(client.getServerSnapshot()).toBe(client.getServerSnapshot())
    expect(client.getServerSnapshot().status).toBe('idle')
  })

  it('starts capabilities concurrently rather than in series', async () => {
    const order: string[] = []
    const gate = (name: string, delay: number): TintCapability => ({
      async start() {
        order.push(`enter:${name}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        order.push(`exit:${name}`)
      },
    })
    const client = createTintClient({ request, storage: gate('slow', 20) as never, uploads: gate('fast', 0) as never })

    await client.start()

    // Serial startup would never enter the second capability before the first
    // exits; concurrent startup always does.
    expect(order.slice(0, 2).sort()).toEqual(['enter:fast', 'enter:slow'])
    expect(order.indexOf('exit:fast')).toBeLessThan(order.indexOf('exit:slow'))
  })

  it('isolates a capability failure and restarts just that one', async () => {
    let fail = true
    const storage: TintCapability = {
      start() {
        if (fail) throw new Error('storage is offline')
      },
    }
    const uploadStart = vi.fn()
    const client = createTintClient({ request, storage: storage as never, uploads: capability(uploadStart) as never })

    await client.start()
    expect(client.getSnapshot().status).toBe('degraded')
    expect(client.getSnapshot().readyCapabilities).toEqual(['uploads'])
    expect(client.getSnapshot().capabilities.storage).toMatchObject({
      state: 'failed',
      problem: { detail: 'storage is offline' },
    })
    expect(client.getSnapshot().capabilities.uploads).toEqual({ state: 'ready' })

    fail = false
    const status = await client.restart('storage')

    expect(status).toEqual({ state: 'ready' })
    expect(client.getSnapshot().status).toBe('ready')
    expect(client.getSnapshot().problem).toBeNull()
    // The healthy capability was not torn down to fix its neighbour.
    expect(uploadStart).toHaveBeenCalledOnce()
  })

  it('resolves start() even when every capability fails', async () => {
    const client = createTintClient({ request, storage: { start() { throw new Error('nope') } } as never })
    await expect(client.start()).resolves.toBeUndefined()
    expect(client.getSnapshot().status).toBe('error')
  })

  it('refuses a host capability that shadows a built-in name', () => {
    expect(() => createTintClient({ request, capabilities: { storage: {} } })).toThrow(/built-in/)
  })
})

describe('typed auth operations', () => {
  it('executes an application-defined operation without putting its result in the snapshot', async () => {
    const config: AuthConfig = { version: 'v2', identifierKind: 'username', password: { enabled: true, signUpEnabled: true, verificationRequired: false, recoveryEnabled: true }, providers: [], inviteRequired: false }
    const transport: AuthTransport = {
      async getConfig() { return config },
      async getSession() { return null },
      async signOut() {},
      oauthStartUrl() { return '/' },
      async execute(_operation, input) { return { recoveryKey: String((input as { username: string }).username).toUpperCase() } as never },
    }
    const recovery = defineAuthOperation<{ username: string }, { recoveryKey: string }>('recovery-key')
    const auth = createAuthClient({ transport, broadcastChannel: false })
    await auth.initialize()
    const result = await auth.execute(recovery, { username: 'avery' })

    expect(result.recoveryKey).toBe('AVERY')
    expect(JSON.stringify(auth.getSnapshot())).not.toContain('recoveryKey')
  })
})

describe('fetch request adapter', () => {
  it('serializes JSON and parses the requested response shape', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.body).toBe('{"name":"avery"}')
      expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
      return new Response('{"ok":true}', { status: 201, headers: { 'content-type': 'application/json', 'x-request-id': 'server-1' } })
    })
    const adapter = createFetchRequestAdapter({ fetch: fetchImpl as typeof fetch })
    const result = await adapter.send<{ ok: boolean }>({ method: 'POST', url: '/people', body: { name: 'avery' }, responseType: 'json' })
    expect(result).toMatchObject({ status: 201, data: { ok: true }, requestId: 'server-1' })
  })
})

describe('operations', () => {
  const clock = () => new Date('2026-09-09T00:00:00.000Z')

  it('carries a command from queued through running to succeeded', async () => {
    const seen: string[] = []
    let release = () => {}
    const adapter = createMemoryOperationAdapter({
      now: clock,
      async run(_command, context) {
        context.report('Applying your change…')
        await new Promise<void>((resolve) => { release = resolve })
        return { ok: true }
      },
    })
    const client = createTintClient({ request, operations: adapter })
    await client.start()
    adapter.subscribe(() => seen.push(adapter.getSnapshot().operations[0]!.state))

    const handle = adapter.submit<{ ok: boolean }>({ name: 'player:pause' })
    await Promise.resolve()
    release()
    const operation = await handle.settled

    expect(operation).toMatchObject({ state: 'succeeded', name: 'player:pause', result: { ok: true } })
    expect(operation.settledAt).toBe('2026-09-09T00:00:00.000Z')
    // queued on submit, running, running again for the progress report, then settled.
    expect(seen).toEqual(['queued', 'running', 'running', 'succeeded'])
    // The progress message survives into the settled record.
    expect(adapter.getSnapshot().operations[0]!.message).toBe('Applying your change…')
  })

  it('reports a failure as an outcome rather than a rejection', async () => {
    const adapter = createMemoryOperationAdapter({
      now: clock,
      run() { throw new Error('guild is unreachable') },
    })
    const operation = await adapter.submit({ name: 'plugin:toggle' }).settled

    expect(operation.state).toBe('failed')
    expect(operation.problem).toMatchObject({ code: 'transport_error', detail: 'guild is unreachable' })
  })

  it('treats a repeated idempotency key as the same operation', async () => {
    const run = vi.fn(async () => 'done')
    const adapter = createMemoryOperationAdapter({ now: clock, run })

    const first = adapter.submit({ name: 'play:query', idempotencyKey: 'request-1' })
    const second = adapter.submit({ name: 'play:query', idempotencyKey: 'request-1' })

    expect(second.id).toBe(first.id)
    await Promise.all([first.settled, second.settled])
    expect(run).toHaveBeenCalledOnce()
    expect(adapter.getSnapshot().operations).toHaveLength(1)
  })

  it('cancels a running operation and stops the client from leaving it in flight', async () => {
    let aborted = false
    const adapter = createMemoryOperationAdapter({
      now: clock,
      run(_command, context) {
        return new Promise((_resolve, reject) => {
          context.signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) })
        })
      },
    })
    const handle = adapter.submit({ name: 'play:radio' })
    await Promise.resolve()
    handle.cancel()
    const operation = await handle.settled

    expect(aborted).toBe(true)
    expect(operation.state).toBe('cancelled')
    expect(operation.problem?.code).toBe('aborted')
  })

  it('clears settled operations and leaves pending ones alone', async () => {
    const adapter = createMemoryOperationAdapter({
      now: clock,
      async run(command) { if (command.name === 'slow') await new Promise(() => {}) },
    })
    await adapter.submit({ name: 'fast' }).settled
    adapter.submit({ name: 'slow' })
    await Promise.resolve()

    adapter.clearSettled()
    expect(adapter.getSnapshot().operations.map((operation) => operation.name)).toEqual(['slow'])
  })
})
