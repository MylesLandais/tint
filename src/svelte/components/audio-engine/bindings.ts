import { createSubscriber } from 'svelte/reactivity'

export type SnapshotSource<TSnapshot> = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => TSnapshot
}

/** Read `.snapshot` in markup or `$derived` to follow a plain TypeScript store. */
export function observeAudioStore<TSnapshot>(store: SnapshotSource<TSnapshot>): { readonly snapshot: TSnapshot } {
  const subscribe = createSubscriber((update) => store.subscribe(update))
  return {
    get snapshot() {
      subscribe()
      return store.getSnapshot()
    },
  }
}
