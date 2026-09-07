import React, { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import type { AuthSnapshot } from '../auth/client'
import type { ConnectionSnapshot, NavigationSnapshot, PlaybackSnapshot, UploadSnapshot } from './types'
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

function useCapabilitySnapshot<T>(
  capability: { subscribe?: (listener: () => void) => () => void; getSnapshot?: () => T; getServerSnapshot?: () => T },
  name: string,
): T {
  if (!capability.subscribe || !capability.getSnapshot) {
    throw new Error(`The Tint ${name} adapter must implement the external-store contract.`)
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
