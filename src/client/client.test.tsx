import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createAuthClient, defineAuthOperation, type AuthConfig, type AuthTransport } from '../auth/client'
import { createBrowserPlaybackAdapter, createFetchRequestAdapter, createTintClient, TintCapabilityError, TintClientProvider, useClientStatus, usePlayback } from './index'
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

  it('keeps one capability start across a StrictMode effect replay', async () => {
    const start = vi.fn()
    const stop = vi.fn()
    const client = createTintClient({ request, storage: capability(start, stop) as never })
    function Status() { return <span>{useClientStatus().status}</span> }
    const view = render(<StrictMode><TintClientProvider client={client}><Status /></TintClientProvider></StrictMode>)
    await act(async () => { await Promise.resolve() })
    expect(start).toHaveBeenCalledOnce()
    expect(screen.getByText('ready')).toBeInTheDocument()
    view.unmount()
    await act(async () => { await Promise.resolve() })
    expect(stop).toHaveBeenCalledOnce()
  })

  it('exposes the browser playback queue through its focused hook', async () => {
    const playback = createBrowserPlaybackAdapter({ storageKey: 'tint.test.playback' })
    playback.replaceQueue([{ id: 'one', title: 'Now playing' }], 'one')
    const client = createTintClient({ request, playback })
    function Playback() {
      const { snapshot } = usePlayback()
      return <span>{snapshot.queue[0]?.title}</span>
    }

    const view = render(<TintClientProvider client={client}><Playback /></TintClientProvider>)
    await act(async () => { await Promise.resolve() })
    expect(screen.getByText('Now playing')).toBeInTheDocument()
    view.unmount()
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
    const result = await auth.execute(recovery, { username: 'maya' })

    expect(result.recoveryKey).toBe('MAYA')
    expect(JSON.stringify(auth.getSnapshot())).not.toContain('recoveryKey')
  })
})

describe('fetch request adapter', () => {
  it('serializes JSON and parses the requested response shape', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.body).toBe('{"name":"maya"}')
      expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
      return new Response('{"ok":true}', { status: 201, headers: { 'content-type': 'application/json', 'x-request-id': 'server-1' } })
    })
    const adapter = createFetchRequestAdapter({ fetch: fetchImpl as typeof fetch })
    const result = await adapter.send<{ ok: boolean }>({ method: 'POST', url: '/people', body: { name: 'maya' }, responseType: 'json' })
    expect(result).toMatchObject({ status: 201, data: { ok: true }, requestId: 'server-1' })
  })
})
