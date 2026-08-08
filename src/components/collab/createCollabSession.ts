/*
 * The seam between tint collab config and the vendored Yjs engine.
 *
 * Nothing outside `src/components/collab/` imports `src/vendor/yjs` directly, so
 * a future engine change touches this file and the broadcast provider.
 *
 * Hosts own CollabConfig. The document is the kernel; network and awareness are
 * meshable ports — the same split as the Yjs collaborative-editor guide, minus
 * Quill and minus the public demo websocket.
 */

import * as Y from '../../vendor/yjs'
import { TintAwareness } from './awareness'
import { connectBroadcastProvider } from './broadcast'
import type { CollabConfig, CollabSession } from './types'

export function createCollabSession(config: CollabConfig): CollabSession {
  const fragmentName = config.fragment ?? 'tint'
  const network = config.network ?? { kind: 'none' }
  const wantAwareness = config.awareness !== false

  const doc = new Y.Doc()
  const fragment = doc.getText(fragmentName)
  const awareness = wantAwareness ? new TintAwareness(doc.clientID) : null
  const disconnectors: Array<() => void> = []

  if (network.kind === 'broadcast') {
    disconnectors.push(
      connectBroadcastProvider(doc, network.channel ?? config.room, awareness),
    )
  }

  if (network.kind === 'websocket') {
    const provider = network.createProvider({
      url: network.url,
      room: network.room ?? config.room,
      doc,
      awareness,
    })
    disconnectors.push(() => provider.destroy())
  }

  return {
    doc,
    fragment,
    awareness,
    destroy() {
      for (const disconnect of disconnectors.splice(0)) disconnect()
      awareness?.destroy()
      doc.destroy()
    },
  }
}
