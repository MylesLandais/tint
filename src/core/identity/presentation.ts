import type { Identity } from './types'

export function identityInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : words[0]?.[1] ?? ''
  return `${first}${last}`.toLocaleUpperCase()
}

export function visibleIdentities(identities: readonly Identity[], max: number): readonly Identity[] {
  return identities.slice(0, Math.max(0, max))
}

export function identityOverflow(identities: readonly Identity[], max: number): number {
  return identities.length - visibleIdentities(identities, max).length
}
