import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { Identity, Presence } from '../../../core/identity'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  identity?: Identity
  name?: string
  src?: string
  alt?: string
  size?: AvatarSize
  presence?: Presence
  badge?: Snippet
  decorative?: boolean
}

export type AvatarGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  identities: readonly Identity[]
  max?: number
  size?: AvatarSize
  renderLink?: Snippet<[identity: Identity, avatar: Snippet]>
}
