import type { KnownAuthProviderId } from './providers'

/** A sign-in method as recorded in `AuthSession.authenticationMethods`. */
export type AuthMethodId = KnownAuthProviderId | 'password' | 'email' | 'passkey' | (string & {})

/** The subset of `Storage` the last-used store needs, so tests and hosts can inject their own. */
export type LastUsedStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type LastUsedStore = {
  read(): AuthMethodId | null
  remember(method: AuthMethodId): void
  clear(): void
}

export const LAST_USED_STORAGE_KEY = 'tint-auth-last-method'

function defaultStorage(): LastUsedStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // Some sandboxed frames throw on the accessor itself.
    return null
  }
}

/**
 * Remembers the last sign-in method on this device. Storage failures (private
 * windows, blocked site data) degrade to "nothing remembered", never to a throw.
 */
export function createLastUsedStore(options: { storage?: LastUsedStorage | null; key?: string } = {}): LastUsedStore {
  const key = options.key ?? LAST_USED_STORAGE_KEY
  const storage = () => (options.storage === undefined ? defaultStorage() : options.storage)
  return {
    read() {
      try {
        return storage()?.getItem(key) || null
      } catch {
        return null
      }
    },
    remember(method) {
      try {
        storage()?.setItem(key, method)
      } catch {
        // Best effort: the badge is a convenience.
      }
    },
    clear() {
      try {
        storage()?.removeItem(key)
      } catch {
        // Best effort.
      }
    },
  }
}

/** A server hint (for example a last-login-method cookie surfaced through config) wins over this device's memory. */
export function resolveLastUsed(serverHint: AuthMethodId | null | undefined, local: AuthMethodId | null): AuthMethodId | null {
  return serverHint || local || null
}

/** The method that produced a session: the first entry of `authenticationMethods`. */
export function methodFromSession(session: { authenticationMethods: readonly string[] } | null | undefined): AuthMethodId | null {
  return session?.authenticationMethods[0] ?? null
}
