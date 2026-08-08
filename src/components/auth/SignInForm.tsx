import React, { useId, useState, type FormEvent, type ReactNode } from 'react'

void React // Keep source-package JSX compatible with consumers using the classic runtime.

export type SignInFormLabels = {
  email: string
  password: string
  submit: string
  submitting: string
  showPassword: string
  hidePassword: string
}

export type SignInFormProps = {
  email: string
  password: string
  busy?: boolean
  error?: ReactNode
  labels: SignInFormLabels
  emailPlaceholder?: string
  passwordPlaceholder?: string
  onEmailChange(value: string): void
  onPasswordChange(value: string): void
  onSubmit(): void | Promise<void>
  className?: string
}

export function SignInForm({
  email,
  password,
  busy = false,
  error,
  labels,
  emailPlaceholder,
  passwordPlaceholder,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  className,
}: SignInFormProps) {
  const prefix = useId()
  const emailId = `${prefix}-email`
  const passwordId = `${prefix}-password`
  const [passwordVisible, setPasswordVisible] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!busy) void onSubmit()
  }

  return (
    <form className={['tint-auth-form', className].filter(Boolean).join(' ')} onSubmit={submit}>
      {error ? <div className="tint-auth-message" role="alert" aria-live="polite">{error}</div> : null}
      <div className="tint-auth-field">
        <label htmlFor={emailId}>{labels.email}</label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          value={email}
          placeholder={emailPlaceholder}
          disabled={busy}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </div>
      <div className="tint-auth-field">
        <label htmlFor={passwordId}>{labels.password}</label>
        <div className="tint-auth-password">
          <input
            id={passwordId}
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            placeholder={passwordPlaceholder}
            disabled={busy}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
          />
          <button
            type="button"
            className="tint-auth-password-toggle"
            aria-label={passwordVisible ? labels.hidePassword : labels.showPassword}
            aria-pressed={passwordVisible}
            disabled={busy}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? labels.hidePassword : labels.showPassword}
          </button>
        </div>
      </div>
      <button className="tint-auth-submit" type="submit" disabled={busy}>
        {busy ? labels.submitting : labels.submit}
      </button>
    </form>
  )
}
