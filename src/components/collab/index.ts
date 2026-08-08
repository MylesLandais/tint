export { createCollabSession } from './createCollabSession'
export { TintAwareness } from './awareness'
export type { AwarenessState } from './awareness'
export type {
  CollabConfig,
  CollabNetwork,
  CollabSession,
  CreateWebsocketProvider,
} from './types'

/** Re-exported for hosts that need a manual update round-trip without importing vendor. */
export { applyUpdate, encodeStateAsUpdate } from '@/vendor/yjs'
