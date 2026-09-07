import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { Identity, Presence } from './types'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  identity?: Identity
  name?: string
  src?: string
  alt?: string
  size?: AvatarSize
  presence?: Presence
  badge?: ReactNode
  decorative?: boolean
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'size-5 text-[0.5625rem]',
  sm: 'size-7 text-[0.625rem]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : words[0]?.[1] ?? ''
  return `${first}${last}`.toLocaleUpperCase()
}

export function Avatar({
  identity,
  name = identity?.name ?? '',
  src = identity?.avatarUrl,
  alt,
  size = 'md',
  presence = identity?.presence,
  badge,
  decorative = false,
  className,
  ...props
}: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  useEffect(() => setFailedSource(null), [src])
  const showImage = Boolean(src) && failedSource !== src
  const imageAlt = decorative ? '' : (alt ?? name)

  return (
    <span
      data-tint-avatar=""
      data-size={size}
      data-presence={presence}
      aria-label={!showImage && !decorative ? name || 'Unknown identity' : undefined}
      aria-hidden={decorative || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-tint-accent-soft font-semibold text-tint-accent',
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={imageAlt}
          className="size-full rounded-[inherit] object-cover"
          onError={() => setFailedSource(src ?? null)}
        />
      ) : (
        <span aria-hidden="true">{initialsFor(name)}</span>
      )}
      {presence && presence !== 'unknown' ? (
        <span
          data-avatar-presence=""
          data-presence={presence}
          title={presence}
          className={cn(
            'absolute right-0 bottom-0 size-[28%] min-h-2 min-w-2 rounded-full border-2 border-tint-panel',
            presence === 'online' && 'bg-tint-success',
            presence === 'away' && 'bg-tint-warning',
            presence === 'busy' && 'bg-tint-danger',
            presence === 'offline' && 'bg-tint-muted',
          )}
        />
      ) : null}
      {badge ? <span className="absolute -top-1 -right-1">{badge}</span> : null}
    </span>
  )
}

export type AvatarGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  identities: readonly Identity[]
  max?: number
  size?: AvatarSize
  renderLink?: (identity: Identity, avatar: ReactNode) => ReactNode
}

export function AvatarGroup({ identities, max = 4, size = 'md', renderLink, className, ...props }: AvatarGroupProps) {
  const visible = identities.slice(0, Math.max(0, max))
  const overflow = Math.max(0, identities.length - visible.length)
  return (
    <div
      data-tint-avatar-group=""
      className={cn('flex -space-x-2 [&>*]:ring-2 [&>*]:ring-tint-panel', className)}
      {...props}
    >
      {visible.map((identity) => {
        const avatar = <Avatar identity={identity} size={size} />
        return <span key={identity.id}>{renderLink ? renderLink(identity, avatar) : avatar}</span>
      })}
      {overflow > 0 ? (
        <span className={cn('inline-flex items-center justify-center rounded-full bg-tint-surface font-medium text-tint-muted', SIZE_CLASS[size])}>
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}
