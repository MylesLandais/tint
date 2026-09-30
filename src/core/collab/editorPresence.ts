import { Awareness, applyAwarenessUpdate } from 'y-protocols/awareness'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as encoding from 'lib0/encoding.js'
import type { Observable } from 'lib0/observable.js'
import type { Doc } from 'yjs'
import type { CollabSession } from './types'

// The vendored bundle's lib0 declaration shim omits the legacy Observable.
export type EditorPresence = Awareness & Pick<Observable<string>, 'on' | 'off' | 'destroy'>
export function createEditorPresence(session: CollabSession) { return new Awareness(session.doc as unknown as Doc) as EditorPresence }
export function persistCollabSession(session: CollabSession, key: string) { return new IndexeddbPersistence(key, session.doc as unknown as Doc) }
/** Adapt authenticated JSON presence to the standard awareness wire protocol. */
export function receiveEditorPresence(presence: Awareness, peer: { client_id: number; clock: number; state: Record<string, unknown> | null }) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint(encoder, peer.client_id)
  encoding.writeVarUint(encoder, peer.clock)
  encoding.writeVarString(encoder, JSON.stringify(peer.state))
  applyAwarenessUpdate(presence, encoding.toUint8Array(encoder), 'remote')
}
