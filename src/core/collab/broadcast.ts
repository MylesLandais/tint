/*
 * Meshable provider: same-tab registry + BroadcastChannel for other tabs.
 *
 * BroadcastChannel does not deliver to the posting browsing context, so two
 * sessions in one docs page would never meet without the in-process mesh.
 * Origin tokens stop echo loops — the same pattern y-websocket uses.
 */

import * as Y from '../../vendor/yjs'
import type { TintAwareness } from './awareness'

type AwarenessWire = {
  type: 'awareness'
  clientId: number
  state: Record<string, unknown> | null
}

type UpdateWire = {
  type: 'update'
  update: number[]
}

type Wire = AwarenessWire | UpdateWire

type Mesh = {
  docs: Set<Y.Doc>
  awareness: Set<TintAwareness>
}

const localMeshes = new Map<string, Mesh>()

function bytesToArray(update: Uint8Array): number[] {
  return Array.from(update)
}

function arrayToBytes(data: number[]): Uint8Array {
  return Uint8Array.from(data)
}

export function connectBroadcastProvider(
  doc: Y.Doc,
  channel: string,
  awareness: TintAwareness | null,
): () => void {
  const origin = Object.create(null) as object
  const mesh = localMeshes.get(channel) ?? { docs: new Set<Y.Doc>(), awareness: new Set<TintAwareness>() }

  for (const peer of mesh.docs) {
    if (peer === doc) continue
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(peer), origin)
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(doc), origin)
  }
  mesh.docs.add(doc)
  if (awareness) {
    for (const peer of mesh.awareness) {
      if (peer === awareness) continue
      awareness.setPeer(peer.clientId, peer.local)
      peer.setPeer(awareness.clientId, awareness.local)
    }
    mesh.awareness.add(awareness)
  }
  localMeshes.set(channel, mesh)

  const bc =
    typeof BroadcastChannel === 'function' ? new BroadcastChannel(channel) : null

  const onUpdate = (update: Uint8Array, updateOrigin: unknown) => {
    if (updateOrigin === origin) return
    for (const peer of mesh.docs) {
      if (peer === doc) continue
      Y.applyUpdate(peer, update, origin)
    }
    bc?.postMessage({ type: 'update', update: bytesToArray(update) } satisfies UpdateWire)
  }

  doc.on('update', onUpdate)

  const unsubscribeAwareness = awareness?.onLocal(() => {
    bc?.postMessage({
      type: 'awareness',
      clientId: awareness.clientId,
      state: awareness.local,
    } satisfies AwarenessWire)
    for (const peer of mesh.awareness) {
      if (peer === awareness) continue
      peer.setPeer(awareness.clientId, awareness.local)
    }
  })

  const onMessage = (event: MessageEvent<Wire>) => {
    const data = event.data
    if (!data || typeof data !== 'object') return
    if (data.type === 'update') {
      Y.applyUpdate(doc, arrayToBytes(data.update), origin)
      return
    }
    if (data.type === 'awareness') {
      awareness?.setPeer(data.clientId, data.state)
    }
  }
  bc?.addEventListener('message', onMessage)

  return () => {
    doc.off('update', onUpdate)
    unsubscribeAwareness?.()
    bc?.removeEventListener('message', onMessage)
    bc?.close()
    mesh.docs.delete(doc)
    if (awareness) mesh.awareness.delete(awareness)
    if (!mesh.docs.size) localMeshes.delete(channel)
  }
}
