import { createSubscriber } from 'svelte/reactivity'
import type { AuthSnapshot } from '../../auth/client'
import type { TintClient } from '../../client/client'
import { TintCapabilityError } from '../../client/errors'
import type {
  ConnectionSnapshot,
  NavigationSnapshot,
  OperationSnapshot,
  PlaybackSnapshot,
  TintCapability,
  TintClientSnapshot,
  UploadSnapshot,
} from '../../client/types'
import { useTintClient } from './context'

/** Read `.snapshot` in markup or a `$derived` expression to track updates. */
export type ReactiveSnapshot<T> = { readonly snapshot: T }

export type ReactiveCapability<TClient, TSnapshot> = ReactiveSnapshot<TSnapshot> & {
  readonly client: TClient
}

type SnapshotSource<T> = {
  subscribe?: (listener: () => void) => () => void
  getSnapshot?: () => T
  getServerSnapshot?: () => T
}

function observeSnapshot<T>(source: SnapshotSource<T>, name: string): ReactiveSnapshot<T> {
  if (!source.subscribe || !source.getSnapshot) throw new TintCapabilityError(name)

  const subscribe = createSubscriber((update) => source.subscribe!(update))
  return {
    get snapshot() {
      subscribe()
      if (typeof window === 'undefined' && source.getServerSnapshot) return source.getServerSnapshot()
      return source.getSnapshot!()
    },
  }
}

function observeCapability<TClient extends SnapshotSource<TSnapshot>, TSnapshot>(
  client: TClient,
  name: string,
): ReactiveCapability<TClient, TSnapshot> {
  const observed = observeSnapshot<TSnapshot>(client, name)
  return {
    client,
    get snapshot() { return observed.snapshot },
  }
}

/** Snapshot and status of the shared plain TypeScript TintClient. */
export function useClientStatus(): ReactiveSnapshot<TintClientSnapshot> {
  return observeSnapshot(useTintClient(), 'client')
}

export function useAuth(): ReactiveCapability<NonNullable<TintClient['auth']>, AuthSnapshot> {
  return observeCapability(useTintClient().require('auth'), 'auth')
}

export function useSession() {
  const auth = useAuth()
  return {
    get session() { return auth.snapshot.session },
    get user() { return auth.snapshot.session?.user ?? null },
    get status() { return auth.snapshot.status },
    get task() { return auth.snapshot.task },
    get isLoaded() { return auth.snapshot.status !== 'loading' },
    get isSignedIn() { return auth.snapshot.status === 'signed_in' },
  }
}

export function useConnection(): ReactiveSnapshot<ConnectionSnapshot> {
  return observeSnapshot(useTintClient().require('realtime'), 'realtime')
}

export function useUploads(): ReactiveCapability<NonNullable<TintClient['uploads']>, UploadSnapshot> {
  return observeCapability(useTintClient().require('uploads'), 'uploads')
}

export function useNavigation(): ReactiveCapability<NonNullable<TintClient['navigation']>, NavigationSnapshot> {
  return observeCapability(useTintClient().require('navigation'), 'navigation')
}

export function usePlayback(): ReactiveCapability<NonNullable<TintClient['playback']>, PlaybackSnapshot> {
  return observeCapability(useTintClient().require('playback'), 'playback')
}

export function useOperations(): ReactiveCapability<NonNullable<TintClient['operations']>, OperationSnapshot> {
  return observeCapability(useTintClient().require('operations'), 'operations')
}

/** Host-defined capability; the caller supplies its snapshot type. */
export function useCapability<TSnapshot>(name: string): ReactiveCapability<TintCapability<TSnapshot>, TSnapshot> {
  const capability = useTintClient().require(name) as TintCapability<TSnapshot>
  return observeCapability(capability, name)
}
