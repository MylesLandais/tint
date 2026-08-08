import { cn } from '../../lib/utils'
import { ICON_SIZES } from './sizes'
import type { IconProps } from './types'

/**
 * The single seam every icon in tint renders through. Takes the glyph as a
 * value (`icon={Search}`) rather than as JSX, so there is never a call site
 * that locally renames an import to avoid a collision.
 */
export function Icon({ icon: Glyph, size = 'md', label, className, ...props }: IconProps) {
  return (
    <Glyph
      className={cn(ICON_SIZES[size], className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...props}
    />
  )
}
