import { getContext, onMount, setContext } from 'svelte'
import type { TintClient } from '../../client/client'

const KEY = Symbol.for('@nebula/tint/client')

/**
 * Make a client available to descendants and lease its lifecycle while this
 * component is mounted. Call during component initialisation.
 */
export function provideTintClient(client: TintClient): TintClient {
  setContext(KEY, client)
  onMount(() => {
    void client.start()
    return () => client.stop()
  })
  return client
}

/** Read the client provided by an ancestor; throws when there is none. */
export function useTintClient(): TintClient {
  const client = getContext<TintClient | undefined>(KEY)
  if (!client) throw new Error('useTintClient requires an ancestor that called provideTintClient')
  return client
}
