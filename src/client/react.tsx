import React, { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import type { AuthSnapshot } from '../auth/client'
import { TintCapabilityError } from './errors'
import type {
  ConnectionSnapshot,
  NavigationSnapshot,
  OperationSnapshot,
  PlaybackSnapshot,
  TintCapability,
  UploadSnapshot,
} from './types'
import type { TintClient } from './client'

void React

const TintClientContext = createContext<TintClient | null>(null)

export type TintClientProviderProps = { client: TintClient; children: ReactNode }

export function TintClientProvider({ client, children }: TintClientProviderProps) {
  useEffect(() => {
    void client.start()
    return () => client.stop()
  }, [client])
  return <TintClientContext.Provider value={client}>{children}</TintClientContext.Provider>
}

export function useTintClient(): TintClient {
  const client = useContext(TintClientContext)
  if (!client) throw new Error('useTintClient must be used inside TintClientProvider')
  return client
}

export function useClientStatus() {
  const client = useTintClient()
  return useSyncExternalStore(client.subscribe, client.getSnapshot, client.getServerSnapshot)
}

export function useAuth(): { client: NonNullable<TintClient['auth']>; snapshot: AuthSnapshot } {
  const auth = useTintClient().require('auth')
  const snapshot = useSyncExternalStore(auth.subscribe, auth.getSnapshot, auth.getServerSnapshot)
  return { client: auth, snapshot }
}

export function useSession() {
  const { snapshot } = useAuth()
  return {
    session: snapshot.session,
    user: snapshot.session?.user ?? null,
    status: snapshot.status,
    task: snapshot.task,
    isLoaded: snapshot.status !== 'loading',
    isSignedIn: snapshot.status === 'signed_in',
  }
}

/**
 * The throw sits before `useSyncExternalStore`, which looks like a conditional
 * hook and is not one: whether an adapter implements the external-store
 * contract is fixed for the lifetime of a given client, so this branch is
 * constant across every render of a component subtree. A client swapped for
 * one with different adapters remounts the subtree anyway.
 *
 * It throws `TintCapabilityError` rather than a bare `Error` so that a host
 * error boundary can catch every capability problem — missing, or present but
 * incomplete — as one class.
 */
function useCapabilitySnapshot<T>(
  capability: { subscribe?: (listener: () => void) => () => void; getSnapshot?: () => T; getServerSnapshot?: () => T },
  name: string,
): T {
  if (!capability.subscribe || !capability.getSnapshot) {
    throw new TintCapabilityError(name)
  }
  return useSyncExternalStore(
    capability.subscribe,
    capability.getSnapshot,
    capability.getServerSnapshot ?? capability.getSnapshot,
  )
}

export function useConnection(): ConnectionSnapshot {
  return useCapabilitySnapshot(useTintClient().require('realtime'), 'realtime')
}

export function useUploads(): { client: NonNullable<TintClient['uploads']>; snapshot: UploadSnapshot } {
  const uploads = useTintClient().require('uploads')
  return { client: uploads, snapshot: useCapabilitySnapshot(uploads, 'uploads') }
}

export function useNavigation(): { client: NonNullable<TintClient['navigation']>; snapshot: NavigationSnapshot } {
  const navigation = useTintClient().require('navigation')
  return { client: navigation, snapshot: useCapabilitySnapshot(navigation, 'navigation') }
}

export function usePlayback(): { client: NonNullable<TintClient['playback']>; snapshot: PlaybackSnapshot } {
  const playback = useTintClient().require('playback')
  return { client: playback, snapshot: useCapabilitySnapshot(playback, 'playback') }
}

export function useOperations(): { client: NonNullable<TintClient['operations']>; snapshot: OperationSnapshot } {
  const operations = useTintClient().require('operations')
  return { client: operations, snapshot: useCapabilitySnapshot(operations, 'operations') }
}

/**
 * A host capability registered through `TintClientOptions.capabilities`.
 *
 * Untyped by construction — the client cannot know what a host put there — so
 * the caller supplies the snapshot type. This is the escape hatch that keeps
 * domain state inside the client lifecycle instead of beside it.
 */
export function useCapability<TSnapshot>(name: string): {
  client: TintCapability<TSnapshot>
  snapshot: TSnapshot
} {
  const capability = useTintClient().require(name) as TintCapability<TSnapshot>
  return { client: capability, snapshot: useCapabilitySnapshot<TSnapshot>(capability, name) }
}
