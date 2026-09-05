export type Presence = 'online' | 'away' | 'busy' | 'offline' | 'unknown'

export type Identity = {
  id: string
  name: string
  avatarUrl?: string
  description?: string
  presence?: Presence
  kind?: string
  href?: string
  metadata?: Readonly<Record<string, unknown>>
}
