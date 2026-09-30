/*
 * Ephemeral presence — not a Yjs shared type.
 *
 * Cursors, names, and colors live here so a snapshot / persist path never
 * replays a stale caret. Network providers may piggy-back awareness messages;
 * the CRDT document does not.
 *
 * Local changes are a separate listener channel from peer updates so a mesh
 * provider can broadcast `setLocal` without echoing `setPeer` forever.
 */

export type AwarenessState = Record<string, unknown>

export class TintAwareness {
  readonly clientId: number
  local: AwarenessState = {}
  readonly peers = new Map<number, AwarenessState>()

  #listeners = new Set<() => void>()
  #localListeners = new Set<() => void>()

  constructor(clientId: number) {
    this.clientId = clientId
  }

  setLocal(state: AwarenessState) {
    this.local = { ...state }
    this.#emitLocal()
    this.#emit()
  }

  setPeer(clientId: number, state: AwarenessState | null) {
    if (clientId === this.clientId) return
    if (state == null) this.peers.delete(clientId)
    else this.peers.set(clientId, state)
    this.#emit()
  }

  /** Any local or peer change — for UI. */
  on(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Only `setLocal` — for network providers. */
  onLocal(listener: () => void): () => void {
    this.#localListeners.add(listener)
    return () => {
      this.#localListeners.delete(listener)
    }
  }

  destroy() {
    this.#listeners.clear()
    this.#localListeners.clear()
    this.peers.clear()
    this.local = {}
  }

  #emit() {
    for (const listener of this.#listeners) listener()
  }

  #emitLocal() {
    for (const listener of this.#localListeners) listener()
  }
}
