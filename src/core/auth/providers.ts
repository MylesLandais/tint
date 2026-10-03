/** OAuth providers Tint ships brand marks and default names for. Hosts may still offer any provider id. */
export const AUTH_PROVIDERS = {
  discord: { id: 'discord', name: 'Discord' },
  github: { id: 'github', name: 'GitHub' },
  google: { id: 'google', name: 'Google' },
} as const

export type KnownAuthProviderId = keyof typeof AUTH_PROVIDERS
export type AuthProviderInfo = (typeof AUTH_PROVIDERS)[KnownAuthProviderId]

export function isKnownProvider(id: string): id is KnownAuthProviderId {
  return Object.hasOwn(AUTH_PROVIDERS, id)
}

/** Display name for a provider id; unknown ids fall back to the id itself. */
export function providerName(id: string): string {
  return isKnownProvider(id) ? AUTH_PROVIDERS[id].name : id
}
