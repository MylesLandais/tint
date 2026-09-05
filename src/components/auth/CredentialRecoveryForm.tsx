import type { FormEvent, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type CredentialRecoveryFormProps = Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  identifier: string
  label: string
  submitLabel?: string
  submittingLabel?: string
  placeholder?: string
  busy?: boolean
  error?: ReactNode
  help?: ReactNode
  onIdentifierChange(value: string): void
  onSubmit(): void | Promise<void>
}

export function CredentialRecoveryForm({
  identifier,
  label,
  submitLabel = 'Continue',
  submittingLabel = 'Submitting…',
  placeholder,
  busy = false,
  error,
  help,
  onIdentifierChange,
  onSubmit,
  className,
  ...props
}: CredentialRecoveryFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy) void onSubmit()
  }
  return (
    <form className={cn('tint-form tint-auth-form', className)} aria-busy={busy || undefined} onSubmit={submit} {...props}>
      {error ? <div className="tint-form-banner" role="alert" aria-live="polite">{error}</div> : null}
      <label className="tint-form-control">
        <span className="tint-form-label">{label}</span>
        <input
          className="tint-form-input"
          value={identifier}
          placeholder={placeholder}
          autoComplete="username"
          required
          disabled={busy}
          onChange={(event) => onIdentifierChange(event.target.value)}
        />
      </label>
      {help ? <div className="tint-form-description">{help}</div> : null}
      <button className="tint-form-submit" type="submit" disabled={busy}>
        {busy ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
