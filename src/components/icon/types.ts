import type { ComponentType, SVGProps } from 'react'
import type { IconSize } from './sizes'

/** The shape every lucide-react icon (and any drop-in replacement) satisfies. */
export type IconGlyph = ComponentType<SVGProps<SVGSVGElement>>

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  /** The icon component to render, e.g. `Search` from `lucide-react`. */
  icon: IconGlyph
  size?: IconSize
  /**
   * Accessible name. Omit for decorative icons — the default everywhere
   * today, since every call site pairs its icon with visible or
   * aria-labelled text rather than labeling the icon itself.
   */
  label?: string
}

export type StatusName =
  | 'idle'
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'needs-approval'
  | 'cancelled'

export type StatusPresentation = {
  icon: IconGlyph
  label: string
  tone: string
  spin?: boolean
}

export type StatusIconProps = Omit<IconProps, 'icon'> & {
  status: StatusName
}
