import type * as Y from '@/vendor/yjs'
import type { TintAwareness } from './awareness'

export type CreateWebsocketProvider = (args: {
  url: string
  room: string
  doc: Y.Doc
  awareness: TintAwareness | null
}) => { destroy: () => void }

export type CollabNetwork =
  | { kind: 'none' }
  | { kind: 'broadcast'; channel?: string }
  | {
      kind: 'websocket'
      url: string
      room?: string
      createProvider: CreateWebsocketProvider
    }

export type CollabConfig = {
  /** Yjs room name / BroadcastChannel key. Prefer `workspace:{id}:note:{id}`. */
  room: string
  /** Shared type name on the document. Defaults to `tint`. */
  fragment?: string
  /**
   * Reserved for a persistence provider (y-indexeddb). v1 ignores this — tint
   * has no IndexedDB vendor yet.
   */
  persist?: boolean
  /** Ephemeral presence. Defaults to true. Never written into the CRDT snapshot. */
  awareness?: boolean
  /** Defaults to `{ kind: 'none' }` so tests stay deterministic. */
  network?: CollabNetwork
}

export type CollabSession = {
  doc: Y.Doc
  fragment: Y.Text
  awareness: TintAwareness | null
  destroy: () => void
}
