import React, { type ButtonHTMLAttributes, type ReactNode } from 'react'

void React

export type ButtonVariant = 'secondary' | 'primary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual weight. Defaults to the neutral bordered surface. */
  variant?: ButtonVariant
  /** Control height. `md` matches the form inputs, for buttons beside a field. */
  size?: ButtonSize
  /** Optional leading content (icon). */
  leading?: ReactNode
}

/**
 * A button over the shared `.tint-button` surface.
 *
 * `type` defaults to `button`. The HTML default is `submit`, which turns every
 * unadorned button inside a form into an accidental submit — the single most
 * common form bug this component exists to stop.
 *
 * Styling lives in `styles/button.css`, not here, so hosts can put the same
 * class on an anchor. See that file.
 */
export function Button({
  variant = 'secondary',
  size,
  leading,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={['tint-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {leading}
      {children}
    </button>
  )
}
