import React, { type ReactNode } from 'react'

void React // Keep source-package JSX compatible with consumers using the classic runtime.

export type OAuthOption = { id: string; label: string; href: string; icon?: ReactNode }
export type OAuthButtonsProps = {
  providers: readonly OAuthOption[]
  ariaLabel: string
  className?: string
}

export function OAuthButtons({ providers, ariaLabel, className }: OAuthButtonsProps) {
  if (providers.length === 0) return null
  return (
    <nav className={['tint-auth-oauth', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {providers.map((provider) => (
        <a className="tint-auth-oauth-link" href={provider.href} key={provider.id}>
          {provider.icon}
          <span>{provider.label}</span>
        </a>
      ))}
    </nav>
  )
}
