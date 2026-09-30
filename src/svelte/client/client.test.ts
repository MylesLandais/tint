import { render, screen, waitFor } from '@testing-library/svelte'
import { tick } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { createBrowserPlaybackAdapter } from '../../client/browserPlayback'
import { createTintClient } from '../../client/client'
import { TintCapabilityError } from '../../client/errors'
import type {
  NavigationAdapter,
  NavigationSnapshot,
  TintCapability,
  UploadAdapter,
  UploadSnapshot,
} from '../../client/types'
import ClientProviderFixture from './ClientProviderFixture.svelte'

const request = { async send<T>() { return { status: 200, headers: {}, data: undefined as T } } }

describe('Svelte TintClient bindings', () => {
  it('starts and stops the plain TypeScript client with provider mount lifetime', async () => {
    const start = vi.fn()
    const stop = vi.fn()
    const client = createTintClient({ request, storage: { start, stop } as never })
    const view = render(ClientProviderFixture, { client, mode: 'status' })

    await waitFor(() => expect(screen.getByTestId('client-status')).toHaveTextContent('ready'))
    expect(start).toHaveBeenCalledOnce()
    view.unmount()
    await waitFor(() => expect(stop).toHaveBeenCalledOnce())
  })

  it('tracks playback snapshots and unsubscribes after unmount', async () => {
    const playback = createBrowserPlaybackAdapter({ storageKey: 'tint.test.svelte.playback' })
    playback.replaceQueue([{ id: 'one', title: 'First' }], 'one')
    const originalSubscribe = playback.subscribe
    const unsubscribe = vi.fn()
    const subscribe = vi.spyOn(playback, 'subscribe').mockImplementation((listener) => {
      const stop = originalSubscribe(listener)
      return () => { unsubscribe(); stop() }
    })
    const client = createTintClient({ request, playback })
    const view = render(ClientProviderFixture, { client, mode: 'playback' })

    expect(screen.getByTestId('playback')).toHaveTextContent('First')
    playback.setStatus('playing')
    await tick()
    expect(screen.getByTestId('playback')).toHaveTextContent('playing')
    expect(subscribe).toHaveBeenCalledOnce()
    view.unmount()
    await waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce())
  })

  it('updates a host capability and releases its subscription', async () => {
    let snapshot = 'idle'
    const listeners = new Set<() => void>()
    const player: TintCapability<string> = {
      getSnapshot: () => snapshot,
      subscribe(listener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }
    const client = createTintClient({ request, capabilities: { player } })
    const view = render(ClientProviderFixture, { client, mode: 'host' })

    expect(screen.getByTestId('host')).toHaveTextContent('idle')
    expect(listeners.size).toBe(1)
    snapshot = 'playing'
    for (const listener of listeners) listener()
    await tick()
    expect(screen.getByTestId('host')).toHaveTextContent('playing')
    view.unmount()
    await waitFor(() => expect(listeners.size).toBe(0))
  })

  it('observes focused upload and navigation adapters', async () => {
    let uploadSnapshot: UploadSnapshot = { tasks: [] }
    let navigationSnapshot: NavigationSnapshot = { pathname: '/library' }
    const uploadListeners = new Set<() => void>()
    const navigationListeners = new Set<() => void>()
    const uploads = {
      getSnapshot: () => uploadSnapshot,
      subscribe(listener: () => void) {
        uploadListeners.add(listener)
        return () => { uploadListeners.delete(listener) }
      },
      enqueue: () => [],
      cancel: () => {},
      retry: () => {},
    } as UploadAdapter
    const navigation = {
      getSnapshot: () => navigationSnapshot,
      subscribe(listener: () => void) {
        navigationListeners.add(listener)
        return () => { navigationListeners.delete(listener) }
      },
      href: (to: string) => to,
      navigate: () => {},
      isActive: () => false,
    } as NavigationAdapter
    const client = createTintClient({ request, uploads, navigation })
    const uploadView = render(ClientProviderFixture, { client, mode: 'uploads' })
    const navigationView = render(ClientProviderFixture, { client, mode: 'navigation' })

    expect(screen.getByTestId('uploads')).toHaveTextContent('0')
    expect(screen.getByTestId('navigation')).toHaveTextContent('/library')
    uploadSnapshot = { tasks: [{ id: 'one', file: new File(['a'], 'a.txt'), status: 'queued', progress: 0 }] }
    navigationSnapshot = { pathname: '/queue' }
    for (const listener of uploadListeners) listener()
    for (const listener of navigationListeners) listener()
    await tick()
    expect(screen.getByTestId('uploads')).toHaveTextContent('1')
    expect(screen.getByTestId('navigation')).toHaveTextContent('/queue')
    uploadView.unmount()
    navigationView.unmount()
  })

  it('throws a capability error when a host capability has no snapshot contract', () => {
    const client = createTintClient({ request, capabilities: { player: {} } })
    expect(() => render(ClientProviderFixture, { client, mode: 'host' })).toThrow(TintCapabilityError)
  })
})
